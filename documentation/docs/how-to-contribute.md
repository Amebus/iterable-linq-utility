# How to contribute

Contributions are welcome: bug reports, new operations, fixes, benchmarks and documentation. This page explains how the project is organised and what a pull request needs.

## Before you start

- **Open an issue first** for a new operation or for a change of behaviour, so the design can be agreed before the code is written. For a new operation, write its signatures in the issue: the chain method and the raw function in `Functions`.
- **Record architecture decisions** as an ADR in [`docs/decisions/`](https://github.com/Amebus/iterable-linq-utility/tree/main/docs/decisions). Copy the format of the existing ones.
- **Working with an AI agent?** The repository has instructions for it: see [Working with AI agents](ai-agents.md).

## Set up

The repository has a devcontainer: open it in VS Code (or any editor that supports devcontainers). It runs on `node-alpine:24.18.0` and runs `pnpm install` when the container is created.

Without the devcontainer, install Node 24 and pnpm 11 (the version is pinned in the `packageManager` field of `package.json`), then:

```bash
pnpm install
```

## Project layout

| Path | Content |
| --- | --- |
| `src/functions/` | One file per operation. These are the raw functions exported as `Functions`. |
| `src/types/` | The exported types, including the `IIterableLinqBase` interface of the chain. |
| `src/iterators/` | The building blocks of the lazy operations: `BaseIterator`, `SourceIterator`, `DeferredIterable`. |
| `src/linqIterable.ts` | The chain: each method calls the matching raw function. |
| `test/functions/` | One spec file per operation. |
| `test/_helpers/` | Shared test helpers. |
| `test/bench/` | The benchmarks. |
| `documentation/` | This site. |

The reasons behind this layout are in [ADR 0001](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0001-folder-structure-based-on-topics.md).

## Adding an operation

1. **Write the raw function** in `src/functions/<name>.ts`.
    - Validate every input with `Validations` (`throwIfNotIterable`, `throwIfNotFunction`, …).
    - A [Transformation](api-reference/transformations.md) is lazy: return a `DeferredIterable` that creates a `SourceIterator` subclass, so every run of the chain starts again from the source. A callback error must close the source: see `closeAfterCallbackError` in `map.ts`.
    - An [Action](api-reference/actions.md) runs the chain. When it stops before the end, it must close the source: a `for…of` loop does that for you.
2. **Export it** from `src/functions/index.ts`.
3. **Add it to the chain**: declare the method on `IIterableLinqBase` in `src/types/iterableLinq.ts` and implement it in `src/linqIterable.ts`. A transformation returns `toChain(<name>(this.iterable, …))`, an action returns `<name>(this.iterable, …)`.
4. **Document it with JSDoc**, on the raw function and on the chain method: a summary, `@operation`, `@param`, `@returns`, `@throws`, `@example` and `@since next`. The release replaces `next` with the version; `pnpm check:since` rejects a version that is not released yet. `pnpm check:structure` checks that these tags are there (`@throws` excepted), and that the operation has its specs, its bench, its export and its chain method. The linter checks the syntax (`tsdoc/syntax`).
5. **Test it** in `test/functions/<name>.spec.ts`, and the chain method in `test/linqIterableWrapper/<name>.spec.ts`.
    - `expectTransformation` or `expectAction` (from `test/_helpers/operationKind.ts`) checks that the operation is lazy, or that it runs the chain.
    - `withoutInputIterableThrowsException` (from `test/functions/functionsTestUtility.ts`) checks the input validation.
    - `closableSource` (from `test/_helpers/closableSource.ts`) checks that the source is closed on an early stop or an error.
6. **Document it on this site**, in the right page of the [API Reference](api-reference/index.md). Add a row to the TLDR table, then a section with a "Wrapper" and a "Raw Function" tab, like the existing ones.
7. **Benchmark it** in `test/bench/functions/<name>.bench.ts`, next to a native reference. The [Benchmarks section of the README](https://github.com/Amebus/iterable-linq-utility#benchmarks) explains how.
8. **Add a changeset** with `pnpm changeset`: a `minor` bump and a note for the changelog. See [Commits and pull requests](#commits-and-pull-requests).

## Code style

ESLint enforces the style: tabs, single quotes, semicolons and ordered class members. `.editorconfig` sets 2 spaces for YAML, JSON and Markdown. To fix what can be fixed automatically:

```bash
pnpm lint-fix
```

## Checks before a pull request

Run the same checks as the CI:

```bash
pnpm lint
pnpm typecheck
pnpm check:since
pnpm check:structure
pnpm check:changeset
pnpm build
pnpm check:package
pnpm test
```

For a change that can affect performance, compare with `main`:

```bash
git switch main && pnpm bench:baseline
git switch <your-branch> && pnpm bench
```

Each table then shows a `(baseline)` row next to every case.

## Documentation site

The site uses [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/). To preview it:

```bash
pip install -r documentation/requirements.txt
cd documentation
mkdocs serve
```

The `publish_doc.yml` workflow publishes one version of the site per minor release with [mike](https://github.com/jimporter/mike). To preview the version selector, deploy locally without `--push` and serve the result:

```bash
mike deploy 0.1 latest
mike serve
```

## Commits and pull requests

- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/): `feat`, `fix`, `perf`, `refactor`, `test`, `docs`, `build` or `ci`, an optional scope, and `!` for a breaking change. For example: `fix(range): empty range for NaN arguments`.
- Open the pull request against `main` and link the issues it solves with `Closes #<number>`.
- A pull request that changes `src/` adds a changeset: run `pnpm changeset`, choose the bump and write a note for the users of the library. The CI fails without it. Before 1.0 a breaking change is a `minor`. A change to `src/` that releases nothing (an internal refactor) adds an empty one with `pnpm changeset --empty`. The check also accepts a changeset that the pull request modifies: extending the note of a pending changeset is fine when it describes the new change too.
- Describe every breaking change in the migration guide of the next version, like [Migrating to 0.1.0](migrating-to-0.1.0.md).

## Releases

The repository has one long-lived branch, `main`, and the changesets of the merged pull requests wait there until a release ([ADR 0012](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0012-trunk-based-releases-with-changesets.md)).

1. Run the **Prepare release** workflow from the Actions tab. It runs the checks and opens, or updates, the `chore: release` pull request: the new version in `package.json`, the entries of `CHANGELOG.md`, the changesets deleted, `@since next` replaced with the version.
2. Review the version and the changelog in that pull request. The CI does not run on it, because it is opened with `GITHUB_TOKEN`: the workflow already ran the checks. If `main` ever requires status checks, close and reopen the pull request to run the CI (`check:changeset` is skipped for `changeset-release/*` branches), or merge it as an administrator.
3. Merge it. The **Npm Publish** workflow sees a version without a tag: it publishes the package to npm, creates the tag and the GitHub Release, and deploys the documentation of that minor as `latest`.

### Documentation between releases

The site has a `next` version, deployed on every push to `main` that changes `documentation/` or `src/`: a fix is visible there at once, and in `latest` at the next release ([ADR 0013](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0013-documentation-versions-between-releases.md)).

For an urgent fix to a released version:

```bash
git switch -c docs/0.1 0.1.0   # the release tag
git cherry-pick <commit of the fix on main>
git push -u origin docs/0.1
```

Then run the **Publish Doc** workflow with `ref` set to `docs/0.1`. Without a `ref` it redeploys the last tag.
