# AGENTS.md

Instructions for AI coding agents (Claude Code, Copilot, Cursor, Codex…). Humans: read [How to contribute](documentation/docs/how-to-contribute.md), which this file summarises.

`iterable-linq-utility` is a TypeScript library of lazy, LINQ-like operations on iterables: a fluent chain (`IterableLinq.from(…)`) and raw functions (`Functions`).

## Commands

Run Node and pnpm in the devcontainer (`.devcontainer/`) when it is available, not on the host: `node_modules` is installed for Linux.

```bash
pnpm lint                 # ESLint (pnpm lint-fix to fix)
pnpm typecheck
pnpm check:since          # @since is `next` or a released version
pnpm check:structure      # every operation has specs, bench (with the direct and small groups), export, chain method and a complete JSDoc, in alphabetical order
pnpm check:instructions   # AGENTS.md and the skills link to existing files and ADRs
pnpm check:changeset      # the branch adds a changeset when it changes src/
pnpm check:commits        # the feat, fix, perf and refactor commits of the branch have a body
pnpm build
pnpm check:package
pnpm test:coverage        # the tests, with 100% coverage of src/
pnpm bench                # benchmarks, see the README
pnpm bench:report         # the benchmarks and their report for the pull request (ADR 0021)
```

## Rules

The reasons are in the ADRs in [`docs/decisions/`](docs/decisions/README.md).

- One file per operation in `src/functions/<name>.ts`, exported from `src/functions/index.ts`; the chain method in `src/linqIterable.ts` only delegates to it, and is declared on `IIterableLinqBase` in `src/types/iterableLinq.ts` (ADR 0001, 0005).
- A Transformation is lazy and re-runnable: a `DeferredIterable` that creates a `SourceIterator` subclass (ADR 0004, 0007). An iterator with several states keeps them in a `state` field with a transition table, not a `switch` (ADR 0009).
- An error the library creates goes through `libraryError(operation, message)` or a `Validations` helper, which take the name of the operation: its message starts with `[iterable-linq-utility/<operation>]`. The errors of the source and of the callbacks propagate unchanged (ADR 0020).
- Only the callback call goes in a `try`/`catch`, which calls `closeAfterCallbackError()` and rethrows; an Action that stops early closes the source (ADR 0008).
- Every operation has `test/functions/<name>.spec.ts`, `test/linqIterableWrapper/<name>.spec.ts` and `test/bench/functions/<name>.bench.ts` against a native reference, with the standard scenarios registered by `scenarios()` of `test/bench/helpers.ts` (ADR 0011, 0021, 0022).
- The specs use the shared test sources of `test/_helpers/generators/`. A source needed by a second spec moves there, with its own `<name>.spec.ts` (ADR 0018).
- JSDoc on the raw function and on the chain method: summary, `@operation`, `@param`, `@returns`, `@throws`, `@example`, `@since next` (ADR 0012).
- A pull request that changes `src/` adds a changeset (`pnpm changeset`); before 1.0 a breaking change is a `minor` (ADR 0012).
- A new or changed operation is documented in `documentation/docs/api-reference/` (ADR 0013).
- The operations are in alphabetical order in `src/functions/index.ts`, `src/linqIterable.ts`, `IIterableLinqBase` and the API reference pages, with the overloads next to each other. The imports of specs and benches: `vitest`, the test helpers, a blank line, the code under test, the local utilities (`pnpm lint-fix` sorts them).
- The tests cover every line and branch of `src/`: `pnpm test:coverage` fails below 100%. Code that no test can reach gets `/* istanbul ignore next -- <reason> */` (ADR 0019).
- An architecture decision is recorded as a new ADR.
- Commits follow Conventional Commits, with a body that says what changes or why (always for `feat`, `fix`, `perf`, `refactor`) and `Closes #<number>` in the commit that solves an issue; branch from `main`, one pull request per topic. `main` changes only through a pull request with the `build` check passed, and the release tags cannot be deleted or moved: GitHub rejects anything else (ADR 0016).

## Never

- Change `version` in `package.json`, edit `CHANGELOG.md` by hand, or create tags and GitHub Releases: the release workflow does it.
- Write a version in `@since` for a new API: use `next`.
- Upgrade Node, pnpm, the devcontainer image or dependencies unless asked.
- Edit an accepted ADR: supersede or amend it with a new one (only its status changes).
- Commit, push or open pull requests unless asked. Never push to `main` or force-push it, and never change the rulesets in the settings: change `.github/rulesets/` in a pull request.

## Keeping the instructions in sync

The rules live in three places: this file, the skills in `.agents/skills/` (with their `references/`) and `documentation/docs/how-to-contribute.md`. The ADRs hold the reasons; the instructions point to them and never copy them. In the same pull request that adds, changes, supersedes or amends an ADR or a convention, update all three, and remove the rules that no longer hold. A change to the code the templates in `references/` are taken from (`map`, `some`, the test helpers, the bench helpers) updates those templates too.

## Skills

Procedures with templates, in [`.agents/skills/`](.agents/skills) (`.claude/skills` links there):

- `operation`: add or change an operation of the library.
- `adr`: record an architecture decision.
- `pull-request`: prepare a branch for a pull request (changeset, checks, commits).

How the instructions are organised: [ADR 0014](docs/decisions/0014-instructions-for-ai-coding-agents.md) and [Working with AI agents](documentation/docs/ai-agents.md).
