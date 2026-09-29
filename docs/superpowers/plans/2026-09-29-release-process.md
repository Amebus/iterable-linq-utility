# Release process with changesets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Releases prepared on `main` with changesets: version declared per pull request, `@since next` resolved at release time, publication on merge of the Version Packages pull request, and a `next` version of the documentation.

**Architecture:** Three small TypeScript scripts in `scripts/` (pure functions plus a thin CLI, run by Node 24 type stripping) hold the logic the workflows need: `@since` checks and replacement, the changeset check, the changelog section of a version. The workflows only orchestrate: `build-test.yml` runs the checks, the new `prepare-release.yml` opens the Version Packages pull request with `changesets/action`, `publish.yml` publishes when `package.json` has an untagged version, `publish_doc.yml` gets `release`/`next`/`redeploy` modes.

**Tech Stack:** pnpm 11, Node 24 (type stripping), TypeScript 6, Vitest 5, `@changesets/cli`, `@changesets/changelog-github`, `changesets/action`, GitHub Actions, mike.

**Spec:** `docs/superpowers/specs/2026-09-29-release-process-design.md`. Decision records: `docs/decisions/0012-trunk-based-releases-with-changesets.md`, `docs/decisions/0013-documentation-versions-between-releases.md`.

## Global Constraints

- Run every node/pnpm command in the devcontainer: `docker exec -u vscode -w /workspaces/iterable-linq-utility iterable-linq-utility_devcontainer sh -c '<command>'`. Never on the macOS host. Git commands run on the host.
- Do not change the Node version, the devcontainer image or `packageManager`.
- `publish.yml` keeps its file name (npm trusted publisher is bound to it).
- Tags have no `v` prefix: `X.Y.Z`.
- Placeholder: `@since next`. Only files under `src/` are checked and rewritten.
- Version PR: branch `changeset-release/main`, title and commit `chore: release`.
- `next` docs title: `next (unreleased)`.
- Scripts are ESM TypeScript with erasable syntax only (no enums, no parameter properties), imports with the `.ts` extension, style as `eslint.config.js` (tabs, single quotes, semicolons).
- Conventional Commits; every commit ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. A mistyped placeholder (`@since nxt`, `@since 0.2`) must fail `check:since`, not pass silently — Task 2.
2. `.changeset/README.md` and `.changeset/config.json` are not changesets: a PR that only edits them and `src/` must fail `check:changeset` — Task 3.
3. A re-run of `publish.yml` after npm publish succeeded but the tag step failed must not fail on `npm publish` — Task 6 (skip when `npm view <name>@<version>` exists).
4. A version with no `## X.Y.Z` section in `CHANGELOG.md` (hand-made bump) must still get a GitHub Release, with fallback notes — Task 4.
5. "Prepare release" with no pending changeset must stop with a clear error instead of opening an empty PR — Task 6.

---

### Task 1: Bootstrap changesets

**Files:**
- Modify: `package.json` (devDependencies, scripts), `pnpm-lock.yaml`
- Create: `.changeset/config.json`, `.changeset/README.md` (from `changeset init`), `.changeset/reduce-without-seed.md`, `CHANGELOG.md`
- Modify: `src/functions/reduce.ts`, `src/types/iterableLinq.ts` (`@since 0.2.0` → `@since next`)
- Modify: `docs/superpowers/specs/2026-09-29-release-process-design.md` (script names `.mjs` → `.ts`)
- Modify: `tsconfig.test.json` (`include`: add `"scripts"`)

- [ ] **Step 1:** In the container: `pnpm add -D @changesets/cli @changesets/changelog-github` then `pnpm changeset init`.
- [ ] **Step 2:** Set `.changeset/config.json` to: `"changelog": ["@changesets/changelog-github", { "repo": "Amebus/iterable-linq-utility" }]`, `"commit": false`, `"access": "public"`, `"baseBranch": "main"`, `"updateInternalDependencies": "patch"`, `"ignore": []`.
- [ ] **Step 3:** Create `.changeset/reduce-without-seed.md`:

```md
---
"iterable-linq-utility": minor
---

`reduce()` accepts a call without a seed: the first value is the initial accumulator, like `Array.prototype.reduce` without `initialValue` (#67).
```

- [ ] **Step 4:** Create `CHANGELOG.md`: title `# iterable-linq-utility`, one line: `The changes of 0.1.0 and earlier are in the [GitHub Releases](https://github.com/Amebus/iterable-linq-utility/releases).`
- [ ] **Step 5:** Replace the two `@since 0.2.0` with `@since next`; in the spec replace `check-changeset.mjs`, `check-since.mjs`, `set-since.mjs` with `.ts` names; add `"scripts"` to `tsconfig.test.json` `include`.
- [ ] **Step 6:** Verify in the container: `pnpm changeset status` lists `iterable-linq-utility` with a `minor` bump; `pnpm lint && pnpm typecheck && pnpm test` pass.
- [ ] **Step 7:** Commit `build: set up changesets`.

### Task 2: `@since` check and replacement

**Files:**
- Create: `scripts/since.ts`, `scripts/check-since.ts`, `scripts/set-since.ts`, `scripts/sourceFiles.ts`
- Test: `test/scripts/since.spec.ts`
- Modify: `package.json` scripts, `.github/workflows/build-test.yml`

**Interfaces:**
- Produces (`scripts/since.ts`):
  - `interface ISinceProblem { path: string; line: number; value: string }`
  - `findInvalidSince(files: { path: string; content: string }[], currentVersion: string): ISinceProblem[]` — every `@since <value>` whose value is neither `next` nor an `X.Y.Z` version ≤ `currentVersion`.
  - `replaceSincePlaceholder(content: string, version: string): string` — replaces `@since next` only.
- Produces (`scripts/sourceFiles.ts`): `readSourceFiles(dir: string): { path: string; content: string }[]` — every `*.ts` under `dir`, recursive (`fs.readdirSync` with `recursive: true`).
- Scripts: `"check:since": "node scripts/check-since.ts"`, `"release:version": "changeset version && node scripts/set-since.ts"`.

- [ ] **Step 1: Write the failing tests** in `test/scripts/since.spec.ts` (`import { … } from '../../scripts/since.ts'`):
  - `findInvalidSince` with current `0.1.0`: `@since next`, `@since 0.1.0`, `@since 0.0.10` → `[]`.
  - `@since 0.2.0` → one problem `{ path, line, value: '0.2.0' }` with the 1-based line.
  - `@since nxt`, `@since 0.2`, `@since` with nothing after it on the line → one problem each (Review Focus 1).
  - `0.10.0` > `0.9.0` (numeric, not string, comparison): `@since 0.10.0` with current `0.9.0` is a problem, `@since 0.9.0` with current `0.10.0` is not.
  - `replaceSincePlaceholder(' * @since next\n * @since 0.1.0', '0.2.0')` → `' * @since 0.2.0\n * @since 0.1.0'`; `@since nextVersion` is left unchanged.
- [ ] **Step 2:** Run `pnpm vitest run test/scripts/since.spec.ts` → FAIL (module not found).
- [ ] **Step 3:** Implement `scripts/since.ts` and `scripts/sourceFiles.ts`. CLIs: `check-since.ts` reads `package.json` version and `src/`, prints `path:line: @since <value>` for each problem and exits 1 when any; `set-since.ts` rewrites in place only the files whose content changes and prints how many.
- [ ] **Step 4:** Run the spec → PASS; `pnpm check:since` → exit 0 (Task 1 left only `next` and released versions).
- [ ] **Step 5:** In `build-test.yml` add `- run: pnpm run check:since` after `typecheck`.
- [ ] **Step 6:** `pnpm lint && pnpm typecheck` pass. Commit `ci: check and resolve @since placeholders`.

### Task 3: Changeset check on pull requests

**Files:**
- Create: `scripts/changeset.ts`, `scripts/check-changeset.ts`
- Test: `test/scripts/changeset.spec.ts`
- Modify: `package.json` scripts, `.github/workflows/build-test.yml`

**Interfaces:**
- Produces (`scripts/changeset.ts`): `hasRequiredChangeset(changedFiles: string[], addedFiles: string[]): boolean` — `true` when no changed file starts with `src/`, or when an added file matches `.changeset/*.md` other than `.changeset/README.md`.
- CLI `scripts/check-changeset.ts`: base ref from `GITHUB_BASE_REF` (default `main`); exits 0 with a message when `GITHUB_HEAD_REF` starts with `changeset-release/`; changed files from `git diff --name-only origin/<base>...HEAD`, added from the same with `--diff-filter=A`; on failure prints `This pull request changes src/ but adds no changeset: run "pnpm changeset" (or "pnpm changeset --empty").` and exits 1.
- Script: `"check:changeset": "node scripts/check-changeset.ts"`.

- [ ] **Step 1: Write the failing tests:**
  - `hasRequiredChangeset(['README.md'], [])` → `true`.
  - `hasRequiredChangeset(['src/functions/map.ts'], [])` → `false`.
  - `hasRequiredChangeset(['src/functions/map.ts', '.changeset/brave-owls.md'], ['.changeset/brave-owls.md'])` → `true`.
  - `hasRequiredChangeset(['src/a.ts', '.changeset/README.md', '.changeset/config.json'], ['.changeset/README.md'])` → `false` (Review Focus 2).
  - A changeset modified but not added (`changed` only) with `src/` changed → `false`.
- [ ] **Step 2:** Run the spec → FAIL.
- [ ] **Step 3:** Implement `scripts/changeset.ts` and the CLI (`child_process.execFileSync('git', …)`).
- [ ] **Step 4:** Run the spec → PASS. On the host create a scratch commit touching `src/` on a throwaway branch and run `pnpm check:changeset` in the container → exit 1 with the message; delete the branch.
- [ ] **Step 5:** In `build-test.yml`: checkout with `fetch-depth: 0`; add `- if: github.event_name == 'pull_request'` / `run: pnpm run check:changeset` after `check:since`.
- [ ] **Step 6:** Commit `ci: require a changeset when src/ changes`.

### Task 4: Changelog section of a version

**Files:**
- Create: `scripts/changelog.ts`, `scripts/release-notes.ts`
- Test: `test/scripts/changelog.spec.ts`

**Interfaces:**
- Produces (`scripts/changelog.ts`): `extractChangelogSection(changelog: string, version: string): string | undefined` — the lines after `## <version>` up to the next `## ` heading or the end, trimmed; `undefined` when the heading is missing.
- CLI `scripts/release-notes.ts <version>`: prints the section, or `See [CHANGELOG.md](https://github.com/Amebus/iterable-linq-utility/blob/main/CHANGELOG.md).` when missing (Review Focus 4).

- [ ] **Step 1: Write the failing tests:** a changelog with `## 0.3.0` and `## 0.2.0` sections: `0.3.0` returns only its body (`### Minor Changes` and its bullet), `0.2.0` returns its body up to the end, `0.1.0` returns `undefined`; `## 0.2.0` does not match `## 0.2.01`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `ci: extract the release notes from the changelog`.

### Task 5: Documentation modes

**Files:**
- Modify: `.github/workflows/publish_doc.yml`

- [ ] **Step 1:** Triggers: `workflow_call` with input `mode` (string, default `release`); `workflow_dispatch` with input `ref` (string, default empty = last tag); `push` on `main` with `paths: ['documentation/**', 'src/**']`. `concurrency: gh-pages` (no cancel).
- [ ] **Step 2:** A step computes `mode`: `workflow_dispatch` → `redeploy`, `push` → `next`, otherwise the input. For `redeploy`, resolve `ref` (empty → `git tag --sort=-v:refname | head -1`) and `git checkout "$ref"`.
- [ ] **Step 3:** Deploy commands:
  - `release`: unchanged (`mike deploy --push --update-aliases "$doc_version" latest`, `mike set-default --push latest`).
  - `next`: `mike deploy --push --title "next (unreleased)" next`.
  - `redeploy`: `mike deploy --push "$doc_version"`, plus `--update-aliases "$doc_version" latest` only when `$doc_version` equals the minor of the last tag.
- [ ] **Step 4:** Validate with `docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint:latest` (if the image cannot be pulled, report it and review the YAML by hand). Commit `ci(docs): publish next from main and redeploy released versions`.

### Task 6: Prepare-release and publish workflows

**Files:**
- Create: `.github/workflows/prepare-release.yml`
- Modify: `.github/workflows/publish.yml`

**Interfaces:**
- Consumes: `pnpm release:version` (Task 2), `scripts/release-notes.ts` (Task 4), `publish_doc.yml` input `mode: release` (Task 5).

- [ ] **Step 1: `prepare-release.yml`:** `on: workflow_dispatch`; `permissions: contents: write, pull-requests: write`; `concurrency: prepare-release`. Steps: checkout (`fetch-depth: 0`), pnpm/node as `build-test.yml`, `pnpm install --frozen-lockfile`; a step that fails with `No pending changeset: nothing to release.` when no `.changeset/*.md` other than `README.md` exists (Review Focus 5); `lint`, `typecheck`, `check:since`, `build`, `check:package`, `test`; `changesets/action@v1` with `version: pnpm run release:version`, `title: 'chore: release'`, `commit: 'chore: release'`, `env: GITHUB_TOKEN`. No `publish` input.
- [ ] **Step 2: `publish.yml`:** trigger `push: branches: [main]` and `workflow_dispatch`; `concurrency: publish` (no cancel). Jobs:
  - `check-version`: checkout; output `version` from `package.json`; output `release` = `true` when `git ls-remote --tags origin "refs/tags/$version"` is empty.
  - `build` (`if: needs.check-version.outputs.release == 'true'`): `uses: ./.github/workflows/build-test.yml`.
  - `publish-package`: as today, but the `npm publish` step is skipped when `npm view iterable-linq-utility@$version version` succeeds (Review Focus 3).
  - `github-release` (`needs: publish-package`, `contents: write`): `node scripts/release-notes.ts $version > notes.md`; `gh release create "$version" --target "$GITHUB_SHA" --title "$version" --notes-file notes.md` (creates the tag).
  - `deploy-doc` (`needs: github-release`): `uses: ./.github/workflows/publish_doc.yml` with `mode: release`.
- [ ] **Step 3:** actionlint as in Task 5 → no errors.
- [ ] **Step 4:** Commit `ci: prepare releases with changesets and publish untagged versions`.

### Task 7: Contribution guide and PR

**Files:**
- Modify: `documentation/docs/how-to-contribute.md`, `docs/decisions/0012-…md`, `docs/decisions/0013-…md`

- [ ] **Step 1:** In "Adding an operation": `@since next` in step 4, a new step "Add a changeset: `pnpm changeset`" after testing. In "Checks before a pull request": add `pnpm check:since`. In "Commits and pull requests": a changeset for every change to `src/` (`--empty` when nothing is released; `minor` for breaking changes before 1.0).
- [ ] **Step 2:** New section "Releases": run "Prepare release" (Actions tab), review version and `CHANGELOG.md` in the "chore: release" pull request, merge it to publish npm, tag, GitHub Release and docs; `next` docs follow `main`; urgent fix to a released version: branch `docs/<minor>` from the tag, cherry-pick, run "Publish Doc" with that ref. Link ADR 0012 and 0013.
- [ ] **Step 3:** Full verification in the container: `pnpm lint && pnpm typecheck && pnpm check:since && pnpm build && pnpm check:package && pnpm test`. Dry run of the release: on a throwaway branch `pnpm release:version` → `package.json` `0.2.0`, `CHANGELOG.md` has `## 0.2.0` with the reduce entry, `.changeset/reduce-without-seed.md` deleted, `@since 0.2.0` in `reduce.ts` and `iterableLinq.ts`; then discard the branch.
- [ ] **Step 4:** Commit `docs: release process in the contribution guide`; push `ci/release-process`; open the PR (body: summary, link to spec and ADRs, the manual steps after merge). Replace the Technical Story of ADR 0012/0013 with the PR link, commit `docs(adr): link the release process pull request`, push.
- [ ] **Step 5:** Wait for CI; `check:changeset` must pass (the PR adds `.changeset/reduce-without-seed.md`).
