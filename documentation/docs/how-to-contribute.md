# How to contribute

Contributions are welcome: bug reports, new operations, fixes, benchmarks and documentation. This page explains how the project is organised and what a pull request needs.

## Before you start

- **Open an issue first** for a new operation or for a change of behaviour, so the design can be agreed before the code is written. For a new operation, write its signatures in the issue: the chain method and the raw function in `Functions`.
- **Record architecture decisions** as an ADR in [`docs/decisions/`](https://github.com/Amebus/iterable-linq-utility/tree/main/docs/decisions). Copy the format of the existing ones, and update [Current decisions](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/README.md#current-decisions), the summary of the decisions in force: add a row, merge an amendment into the row it changes, remove a superseded ADR ([ADR 0027](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0027-current-decisions-in-the-adr-index.md)).
- **Working with an AI agent?** The repository has instructions for it: see [Working with AI agents](ai-agents.md). The specs and plans that an agent writes for a change stay local, in `docs/superpowers/`, which git ignores: what must last goes in the issue, the pull request or an ADR ([ADR 0028](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0028-specs-and-plans-stay-out-of-the-repository.md)).

## Set up

The repository has a devcontainer: open it in VS Code (or any editor that supports devcontainers). It runs on the local image `node-alpine:24.20.0`, built from `.devcontainer/Dockerfile`, and runs `pnpm install` when the container is created. Build the image once before opening the devcontainer, and again after changing the Dockerfile:

```bash
.devcontainer/build.sh           # macOS, Linux, WSL (sh, bash or zsh)
pwsh .devcontainer/build.ps1     # Windows (PowerShell)
```

The npm cache and the pnpm store live in the Docker volumes `node24-npm-cache` and `node24-pnpm-store`: they survive a rebuild of the container, and every devcontainer that uses the same names shares them. `docker volume rm node24-pnpm-store` empties the store.

Without the devcontainer, install Node 24 and pnpm 12 (the version is pinned in the `packageManager` field of `package.json`), then:

```bash
pnpm install
```

## Project layout

| Path | Content |
| --- | --- |
| `src/index.ts` | The entry point: the starters (`from`, `fromRange`, …), `Functions`, the extension API and the types. |
| `src/functions/` | One file per operation. These are the raw functions exported as `Functions`. |
| `src/linqIterable.ts` | The chain: each method calls the matching raw function. |
| `src/types/` | The exported types, including the `IIterableLinqBase` interface of the chain. |
| `src/iterators/` | The building blocks of the lazy operations: `BaseIterator`, `SourceIterator`, `DeferredIterable`, and the base classes shared by a few operations. |
| `src/extension.ts` | `extend`, `override` and `isIterableLinq`. |
| `src/utils/` | `Validations`, `libraryError` and the helpers shared by the operations. |
| `src/collections/` | The linked list used by `materialize` and `reverse`. |
| `test/functions/` | One spec file per operation, on the raw function. |
| `test/linqIterableWrapper/` | One spec file per operation, on the chain method. |
| `test/iterators/`, `test/utils/`, `test/collections/`, `test/types/` | The specs of the other parts of `src/`; `test/types/` checks the types. |
| `test/_helpers/` | Shared test helpers and the test sources of `generators/`. |
| `test/bench/` | The benchmarks: see [Benchmarks](benchmarks.md). |
| `test/scripts/` | The specs of `scripts/`. |
| `scripts/` | The checks (`check:*`) and the scripts of the release and of the documentation. |
| `docs/decisions/` | The ADRs, and their index with the current decisions. |
| `.agents/skills/` | The skills for AI agents: see [Working with AI agents](ai-agents.md). |
| `.changeset/` | The changesets waiting for the next release. |
| `documentation/` | This site. |

The reasons behind this layout are in [ADR 0001](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0001-folder-structure-based-on-topics.md). How the parts work together: [Architecture](architecture.md).

## Adding an operation

1. **Write the raw function** in `src/functions/<name>.ts`.
    - Validate every input with `Validations` (`throwIfNotIterable`, `throwIfNotFunction`, …), passing the name of the operation as the last argument: `Validations.throwIfNotFunction(predicate, 'predicate', 'filter')`. Any other error is created with `libraryError('<name>', message)`. The message then starts with `[iterable-linq-utility/<name>]` ([ADR 0020](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0020-error-messages-of-the-library.md)).
    - An operation that compares values follows its native counterpart: `indexOf` uses `===` like `Array.prototype.indexOf`, `includes` uses `SameValueZero` like `Array.prototype.includes`. Without a counterpart it uses `SameValueZero`, like `Set` and `Map`, and takes a callback (`equals`, a key selector) for a different equality. The JSDoc and the API reference state the equality ([ADR 0024](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0024-equality-of-the-operations-that-compare-values.md)). See [Equality](basic-concepts.md#equality).
    - A selector that reads a value from the element also accepts a property key: an overload `P extends keyof T` (or `KeysOfType<T, V>`) after the function one, validated with `Validations.throwIfNotSelector`. When `isPropertyKey(selector)`, read the key inline without slowing the function form. A Transformation creates an iterator class for the key (`map`), reads a key field in the branch the iterator already has for a missing selector (`union`), or keeps a property field next to the function field when a selector is never missing (`innerJoin`). An Action calls a function for the key and keeps the loop of the selector in a function of its own (`sum`). Measure the function form against `main` after the change. Predicates, reducers and taps keep functions only ([ADR 0025](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0025-property-keys-as-selectors.md)). One key, never an array: a nested property or a composite key is a function ([ADR 0026](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0026-arrays-of-keys-are-not-selectors.md)). See [Selectors](basic-concepts.md#selectors).
    - A [Transformation](api-reference/transformations.md) is lazy: return a `DeferredIterable` that creates a `SourceIterator` subclass, so every run of the chain starts again from the source. A callback error must close the source: see `closeAfterCallbackError` in `map.ts`.
    - An [Action](api-reference/actions.md) runs the chain. When it stops before the end, it must close the source: a `for…of` loop does that for you.
2. **Export it** from `src/functions/index.ts`.
3. **Add it to the chain**: declare the method on `IIterableLinqBase` in `src/types/iterableLinq.ts` and implement it in `src/linqIterable.ts`. A transformation returns `toChain(<name>(this.iterable, …))`, an action returns `<name>(this.iterable, …)`.
4. **Document it with JSDoc**, on the raw function and on the chain method: a summary, `@operation`, `@param`, `@returns`, `@throws`, `@example` and `@since next`. The release replaces `next` with the version; `pnpm check:since` rejects a version that is not released yet. `pnpm check:structure` checks that these tags are there (`@throws` excepted), and that the operation has its specs, its bench, its export and its chain method. The linter checks the syntax (`tsdoc/syntax`).
5. **Test it** in `test/functions/<name>.spec.ts`, and the chain method in `test/linqIterableWrapper/<name>.spec.ts`.
    - `expectTransformation` or `expectAction` (from `test/_helpers/operationKind.ts`) checks that the operation is lazy, or that it runs the chain.
    - `withoutInputIterableThrowsException` (from `test/functions/functionsTestUtility.ts`) checks the input validation, and that the message starts with `[iterable-linq-utility/<name>]`.
    - The test sources in `test/_helpers/generators/` record how the operation reads its source; a source that a second spec needs moves to this folder, with its own spec ([ADR 0018](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0018-shared-test-sources.md)):
        - `closableSource` checks that the source is closed on an early stop or an error;
        - `spyIterable` counts the iterations and the values read;
        - `infiniteSource` checks that the operation stops on an infinite source; `stats.reads` counts the values read, `stats.closed` tells whether it was closed;
        - `throwingSource` throws at the n-th read, to check how the operation handles a source error.
    - The tests cover every line and branch of `src/`: `pnpm test:coverage` fails below 100%, and Codecov comments the pull request with the uncovered lines ([ADR 0019](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0019-full-test-coverage-of-the-library.md)). Code that no test can reach gets `/* istanbul ignore next -- <reason> */`.
6. **Document it on this site**, in the right page of the [API Reference](api-reference/index.md). Add a row to the TLDR table, then a section with a "Wrapper" and a "Raw Function" tab, like the existing ones.
7. **Benchmark it** in `test/bench/functions/<name>.bench.ts`, next to a native reference (and a hand-written loop when the array method is a different algorithm), with the standard scenarios: `direct`, `small`, after a `map`, after a `filter`, the early exit and the optional callback where they apply ([ADR 0021](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0021-benchmark-standards.md), [ADR 0022](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0022-benchmark-scenarios-in-practice.md)). `scenarios()` and `group()` of `test/bench/helpers.ts` register them; `pnpm check:structure` checks that the `direct` and `small` groups are there. Paste the output of `pnpm bench:report functions/<name>` in the pull request. [Benchmarks](benchmarks.md) explains how.
8. **Add a changeset** with `pnpm changeset`: a `minor` bump and a note for the changelog. See [Commits and pull requests](#commits-and-pull-requests).

## Code style

ESLint enforces the style: tabs, single quotes, semicolons, ordered class members, and the order of the imports in the specs and the benches: `vitest`, the test helpers, a blank line, the code under test, then the local utilities, each group in alphabetical order.

The operations are listed in alphabetical order, with the overloads of an operation next to each other: the exports of `src/functions/index.ts`, the imports and the methods of `src/linqIterable.ts`, the members of `IIterableLinqBase`, and the sections and the TLDR rows of the API reference. `pnpm check:structure` checks it. `.editorconfig` sets 2 spaces for YAML, JSON and Markdown. To fix what can be fixed automatically:

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
pnpm check:instructions
pnpm check:changeset
pnpm check:commits
pnpm build
pnpm check:package
pnpm test:coverage
```

For a change that can affect performance, compare with `main`:

```bash
git switch main && pnpm bench:baseline
git switch <your-branch> && pnpm bench:report functions/<name>
```

The report then has a `vs baseline` column. Paste it in the pull request as it is: it starts with a line that describes the machine (set `BENCH_HOST` to name the host, which the devcontainer cannot see).

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
- A commit has a body when its subject alone does not explain it, and always for `feat`, `fix`, `perf` and `refactor`: what changes for the users, or why, not how. The commit that solves an issue has `Closes #<number>` in its body. A trivial commit, like a typo, can have no body. `pnpm check:commits` checks the body of the `feat`, `fix`, `perf` and `refactor` commits. For example:

    ```text
    feat(take): add take() Transformation

    Yields the first `count` values, then closes the source without reading
    past the `count`-th value. Available as `Functions.take` and on the chain.

    Closes #26
    ```

- Open the pull request against `main` and link the issues it solves with `Closes #<number>`.
- A pull request that changes `src/` adds a changeset: run `pnpm changeset`, choose the bump and write a note for the users of the library. The CI fails without it. The note is one sentence: the operation with its signature in backticks, what changes, the native API it matches when there is one, and the issue in parentheses, like the notes in `CHANGELOG.md`: "New `skip(count)` Transformation: lazily skips the first `count` values and yields the rest (#27)." A reference to an ADR or to a page of this site is a Markdown link with an absolute URL, because the note is shown in `CHANGELOG.md` on GitHub, on npm and on this site: an ADR links to its file on GitHub, a page to the version of the site that introduces it. Only `#N` becomes a link by itself. Before 1.0 a breaking change is a `minor`. A change to `src/` that releases nothing (an internal refactor) adds an empty one with `pnpm changeset --empty`. The check also accepts a changeset that the pull request modifies: extending the note of a pending changeset is fine when it describes the new change too.
- Describe every breaking change in the migration guide of the next version, like [Migrating to 0.1.0](migrating-to-0.1.0.md), and add a new guide to the Upgrading section of the `nav` in `documentation/mkdocs.yml`, newest first.
- `main` accepts changes only through a pull request whose `build` check passed: a direct push or a force-push is rejected. No review is required, and the branch does not have to be up to date with `main`. See [Protection rules](releasing.md#protection-rules).

## Releases

The maintainer releases from `main`, with the changesets of the merged pull requests: see [Releasing](releasing.md), with the protection rules of `main` and the documentation between releases.
