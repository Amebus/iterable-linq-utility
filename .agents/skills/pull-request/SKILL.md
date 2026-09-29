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
- The note is for the users of the library: what changes for them, with the API names in backticks.
- Never change `version` in `package.json` or edit `CHANGELOG.md`: the release does it.
- New APIs have `@since next`.

## 3. Checks

The same as the CI, in the devcontainer:

```bash
pnpm lint && pnpm typecheck && pnpm check:since && pnpm check:structure && pnpm check:instructions && pnpm check:changeset && pnpm build && pnpm check:package && pnpm test
```

For a change that can affect performance, compare the benchmarks with `main` (`pnpm bench:baseline` on `main`, then `pnpm bench`).

## 4. Commits

[Conventional Commits](https://www.conventionalcommits.org/): `feat`, `fix`, `perf`, `refactor`, `test`, `docs`, `build` or `ci`, an optional scope, `!` for a breaking change. For example `fix(range): empty range for NaN arguments`. Small commits, each one passing the checks.

## 5. Pull request

Against `main`. The description says what changes and why, lists what was verified, and links the issues it solves with `Closes #<number>`.

`main` accepts changes only through a pull request whose `build` check passed ([ADR 0016](../../../docs/decisions/0016-protection-rules-for-main-and-release-tags.md)): never push to it directly. The branch does not have to be up to date with `main` to be merged.
