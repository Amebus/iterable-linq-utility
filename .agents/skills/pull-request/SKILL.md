---
name: pull-request
description: Use before committing, pushing or opening a pull request on iterable-linq-utility - branch, changeset, local checks, Conventional Commits and the pull request description.
---

# Prepare a pull request

The process is described in [How to contribute](../../../documentation/docs/how-to-contribute.md#commits-and-pull-requests) and in [ADR 0012](../../../docs/decisions/0012-trunk-based-releases-with-changesets.md). Commit, push and open the pull request only when the user asks.

## 1. Branch

A branch from an up-to-date `main`, one topic per branch: `feat/…`, `fix/…`, `docs/…`, `ci/…`, `refactor/…`.

## 2. Changeset

Required when the branch changes `src/` (`check:changeset` fails without it):

```bash
pnpm changeset          # choose the bump, write the note
pnpm changeset --empty  # a change to src/ that releases nothing, e.g. an internal refactor
```

- `minor` for a new operation or a new overload, `patch` for a fix. Before 1.0 a breaking change is a `minor`, and it gets a section in the migration guide of the next version (see `documentation/docs/migrating-to-0.1.0.md`).
- The note is for the users of the library, in one sentence: the operation with its signature in backticks, what changes for them, the native API it matches when there is one, and the issue in parentheses at the end. Once merged, it is on the Upcoming page of the `next` documentation until the release (ADR 0017). The notes of the released versions, in `CHANGELOG.md`, are the model:

    ```markdown
    New `skip(count)` Transformation: lazily skips the first `count` values and yields the rest (#27).

    `reduce()` accepts a call without a seed: the first value is the initial accumulator, like `Array.prototype.reduce` without `initialValue` (#67).
    ```
- Never change `version` in `package.json` or edit `CHANGELOG.md`: the release does it.
- New APIs have `@since next`.

## 3. Checks

The same as the CI, in the devcontainer:

```bash
pnpm lint && pnpm typecheck && pnpm check:since && pnpm check:structure && pnpm check:instructions && pnpm check:changeset && pnpm check:commits && pnpm build && pnpm check:package && pnpm test:coverage
```

`test:coverage` fails below 100% of `src/` ([ADR 0019](../../../docs/decisions/0019-full-test-coverage-of-the-library.md)): the report in `coverage/` shows the uncovered lines.

For a change that can affect performance, compare the benchmarks with `main` (`pnpm bench:baseline` on `main`, then `pnpm bench:report <filter>` on the branch). A pull request that adds an operation or changes its performance pastes the output of `pnpm bench:report functions/<name>` in its description, as it is: the environment line and the table ([ADR 0021](../../../docs/decisions/0021-benchmark-standards.md)).

## 4. Commits

[Conventional Commits](https://www.conventionalcommits.org/): `feat`, `fix`, `perf`, `refactor`, `test`, `docs`, `build` or `ci`, an optional scope, `!` for a breaking change. For example `fix(range): empty range for NaN arguments`. Small commits, each one passing the checks.

The message has a body when the subject alone does not explain the commit, and always for `feat`, `fix`, `perf` and `refactor`: what changes for the users, or why, not how (the diff shows that). The commit that solves an issue has `Closes #<number>` in its body, as well as in the pull request description, so the history stays linked to the issue outside GitHub too. A trivial commit (a typo, a small documentation fix) can have no body. `pnpm check:commits` fails on a `feat`, `fix`, `perf` or `refactor` commit whose body has only trailers and issue links.

```text
feat(take): add take() Transformation

Yields the first `count` values, then closes the source without reading
past the `count`-th value. Available as `Functions.take` and on the chain.

Closes #26
```

## 5. Pull request

Against `main`. The description says what changes and why, lists what was verified, and links the issues it solves with `Closes #<number>`.

`main` accepts changes only through a pull request whose `build` check passed ([ADR 0016](../../../docs/decisions/0016-protection-rules-for-main-and-release-tags.md)): never push to it directly. The branch does not have to be up to date with `main` to be merged.
