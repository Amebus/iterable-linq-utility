# How to contribute

Contributions are welcome: bug reports, new operations, fixes, benchmarks and documentation. This page explains how the project is organised and what a pull request needs.

## Before you start

- **Open an issue first** for a new operation or for a change of behaviour, so the design can be agreed before the code is written. For a new operation, write its signatures in the issue: the chain method and the raw function in `Functions`.
- **Record architecture decisions** as an ADR in [`docs/decisions/`](https://github.com/Amebus/iterable-linq-utility/tree/main/docs/decisions). Copy the format of the existing ones.

## Set up

The repository has a devcontainer: open it in VS Code (or any editor that supports devcontainers). It runs on `node-alpine:24.20.0` and runs `pnpm install` when the container is created.

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
4. **Document it with JSDoc**, on the raw function and on the chain method: a summary, `@operation`, `@param`, `@returns`, `@throws`, `@example` and `@since`. The linter checks the syntax (`tsdoc/syntax`).
5. **Test it** in `test/functions/<name>.spec.ts`.
    - `expectTransformation` or `expectAction` (from `test/_helpers/operationKind.ts`) checks that the operation is lazy, or that it runs the chain.
    - `withoutInputIterableThrowsException` (from `test/functions/functionsTestUtility.ts`) checks the input validation.
    - `closableSource` (from `test/_helpers/closableSource.ts`) checks that the source is closed on an early stop or an error.
6. **Document it on this site**, in the right page of the [API Reference](api-reference/index.md). Add a row to the TLDR table, then a section with a "Wrapper" and a "Raw Function" tab, like the existing ones.
7. **Benchmark it** in `test/bench/functions/<name>.bench.ts`, next to a native reference. The [Benchmarks section of the README](https://github.com/Amebus/iterable-linq-utility#benchmarks) explains how.

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
- Describe every breaking change in the migration guide of the next version, like [Migrating to 0.1.0](migrating-to-0.1.0.md).
