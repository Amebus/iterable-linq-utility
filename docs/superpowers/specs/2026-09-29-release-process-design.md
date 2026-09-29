# Release process with changesets — design

* Status: approved
* Date: 2026-09-29
* Branch: `ci/release-process`
* Decision records: `docs/decisions/0012-trunk-based-releases-with-changesets.md`, `docs/decisions/0013-documentation-versions-between-releases.md`

## Context

The package version has no defined moment to change. A release is manual: the maintainer creates a GitHub Release, which triggers `publish.yml` (npm with trusted publishing, then the documentation). A pull request does not know which version it will ship in, so the JSDoc `@since` tags are guessed: #69 (`reduce()` without a seed) merged `@since 0.2.0` while `package.json` and the last tag are `0.1.0`.

The documentation has the same gap. `publish_doc.yml` publishes what is on `main` under the version in `package.json`, so between two releases a fix to the site would also publish the documentation of features that are not released yet.

## Goals

* The version bump is declared, and reviewed, in the pull request that makes the change.
* Several pull requests can be released together, when the maintainer decides.
* `@since` never holds a guessed version: it is set when the version is.
* One click prepares a release; merging it publishes npm, the tag, the GitHub Release and the documentation.
* Documentation fixes can go online between releases without publishing unreleased APIs.

## Non-goals

* A `release` or `develop` branch (gitflow).
* Versions computed from commit messages.
* Pre-releases (`next` npm dist-tag, `-beta` versions).
* Branch protection rules (configured by hand on GitHub, outside the repository).

## Constraints

* The npm trusted publisher (OIDC) is bound to the workflow file name `publish.yml`: the file keeps its name.
* Tags have no `v` prefix (`0.0.16`, `0.1.0`); new tags follow the same format.
* A tag, a release or a pull request created with `GITHUB_TOKEN` does not trigger other workflows. Publishing must run in the workflow that detects the new version, not in one triggered by the tag.
* `tsdoc.json` defines `@since` as a block tag, so `@since next` passes `tsdoc/syntax`.
* The node toolchain runs in the devcontainer (`node-alpine:24.18.0`).

## Design

### 1. Pull requests

* Branches start from `main` and merge into `main`.
* A pull request that changes `src/` adds a changeset, created with `pnpm changeset`: a `.changeset/<name>.md` file with the bump (`patch`, `minor` or `major`) and a note written for users. A change to `src/` that releases nothing (an internal refactor) adds an empty changeset with `pnpm changeset --empty`.
* Before 1.0, a breaking change is declared as `minor`.
* New public APIs use `@since next` in their JSDoc.
* Two new checks, run by `build-test.yml`:
  * `pnpm check:changeset` (`changeset status --since=origin/main`, with `changedFilePatterns: ["src/**"]` in `.changeset/config.json`), on pull requests only: fails when the diff against `main` changes a file under `src/` and adds no changeset. Branches named `changeset-release/*` are skipped.
  * `pnpm check:since` (`scripts/check-since.ts`), always: every `@since` under `src/` is `next` or a version lower than or equal to `package.json` `version`.

### 2. Preparing a release

New workflow `prepare-release.yml`, started by hand (`workflow_dispatch`) on `main`:

1. Checkout, pnpm and node as in `build-test.yml`, `pnpm install --frozen-lockfile`.
2. Stops with an error when there is no pending changeset.
3. Runs `lint`, `typecheck`, `check:since`, `build`, `check:package` and `test`.
4. Runs `changesets/action` with `version: pnpm release:version`, title and commit message `chore: release`. The action commits on the branch `changeset-release/main` and opens, or updates, the "Version Packages" pull request to `main`. It uses `GITHUB_TOKEN`, so the normal CI does not run on that pull request: step 3 already ran the same checks.
   * `release:version` runs `changeset version` (bumps `package.json`, writes `CHANGELOG.md` with links to the pull requests through `@changesets/changelog-github`, deletes the consumed changesets), then `scripts/set-since.ts`.
   * `scripts/set-since.ts` replaces `@since next` with the new `package.json` `version` in `src/**/*.ts`.

The maintainer reviews the version and the changelog in that pull request and merges it when the release should go out. Changesets merged in the meantime are added to the next run of the workflow.

### 3. Publishing

`publish.yml` keeps its name. Its trigger changes from `release: created` to `push` on `main`, plus `workflow_dispatch` to retry a failed publication.

1. `check-version` job: reads `package.json` `version` and sets `release=true` when no tag with that name exists on the remote.
2. When `release=true`:
   1. `build`: reuses `build-test.yml`.
   2. `publish-package`: unchanged, `npm publish` with trusted publishing.
   3. `github-release`: creates the tag `X.Y.Z` and a GitHub Release whose notes are the `## X.Y.Z` section of `CHANGELOG.md`.
   4. `deploy-doc`: calls `publish_doc.yml` in `release` mode.
3. `concurrency` on the workflow, so two pushes do not publish in parallel.

A push to `main` that does not change the version finds the tag and does nothing.

### 4. Documentation

`publish_doc.yml` gets a `mode` (`release`, `next` or `redeploy`) and a `ref`. A `concurrency` group serialises the pushes of mike to `gh-pages`.

* `release` (called by `publish.yml`): as today, `mike deploy --update-aliases <minor> latest` and `mike set-default latest`.
* `next` (new trigger: `push` on `main` with `paths` `documentation/**` and `src/**`): `mike deploy next --title "next (unreleased)"`. `latest` and the default version do not change.
* `redeploy` (`workflow_dispatch`, input `ref`, default the last tag): checks out `ref` and deploys its `<minor>`. It moves `latest` only when that minor is the minor of the last tag. For an urgent fix to released documentation: merge the fix into `main` (it goes online in `next`), create `docs/<minor>` from the release tag, cherry-pick the fix, run the workflow with that branch as `ref`.

### 5. Bootstrap

* devDependencies `@changesets/cli` and `@changesets/changelog-github`, installed in the devcontainer.
* `.changeset/config.json`: `baseBranch: "main"`, `access: "public"`, `commit: false`, `changelog: ["@changesets/changelog-github", { "repo": "Amebus/iterable-linq-utility" }]`.
* `CHANGELOG.md` starts with a line that points to the GitHub Releases for 0.1.0 and earlier.
* `src/functions/reduce.ts` and `src/types/iterableLinq.ts`: `@since 0.2.0` becomes `@since next`, and a `minor` changeset describes `reduce()` without a seed (#67).
* `documentation/docs/how-to-contribute.md`: a changeset step in "Adding an operation" and in the pull request checklist, `@since next`, and a new "Releases" section (prepare, review, merge, `next` documentation, redeploy).
* ADR 0012 and ADR 0013, added to `docs/decisions/README.md`.

## Testing

* The three scripts export pure functions (input: file contents, diff, versions) with a thin command-line wrapper, and are tested with Vitest in `test/scripts/`.
* `pnpm release:version` on a scratch copy: `package.json` at `0.2.0`, the `reduce` entry in `CHANGELOG.md`, no changeset left, `@since 0.2.0` in the two files.
* The workflows are checked with `actionlint` when available.
* On the pull request: CI green; a temporary commit that changes `src/` without a changeset makes `check:changeset` fail.
* After the merge: "Prepare release" opens the 0.2.0 Version pull request; merging it publishes 0.2.0 to npm, creates the tag and the GitHub Release, and deploys the 0.2 documentation; a documentation-only push to `main` updates `next`.
