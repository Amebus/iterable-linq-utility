# Full test coverage of the library

* Status: accepted
* Deciders: Amebus
* Date: 2026-10-03

Technical Story: https://github.com/Amebus/iterable-linq-utility/pull/127

## Context and Problem Statement

The CI uploads the coverage of `src/` to Codecov, which comments every pull request and publishes a `codecov/patch` check. Without a configuration that check only asks not to go below the coverage of the base, and it is not required: a branch of `closeAfterCallbackError()` stayed uncovered until #127, and a pull request that leaves new code untested can still be merged. The library is at 100% today. Should a pull request be allowed to lower it, and who stops it?

## Decision Drivers

* An untested line or branch of the library is seen before the merge, not after
* The rule can be checked locally, in the devcontainer, before opening a pull request
* An outage of an external service does not block a merge
* An exception is possible, and visible in review

## Considered Options

* A: a 100% threshold in Vitest, which fails the required `build` check, and Codecov as information on the pull request
* B: Codecov only, with a 100% target, informational
* C: Codecov only, with `codecov/patch` required by the ruleset of `main`
* D: nothing: the default Codecov comment

## Decision Outcome

Chosen option: "A: a 100% threshold in Vitest, and Codecov as information".

* `vitest.config.ts` sets `coverage.thresholds` to 100% for statements, branches, functions and lines of `src/`. `pnpm test:coverage`, which the `build` check runs, fails below.
* `codecov.yml` sets the patch target to 100%, and makes the patch and project checks informational: Codecov comments the pull request with the uncovered lines, but does not decide the merge.
* Code that no test can reach is excluded with `/* istanbul ignore next -- <reason> */` (the coverage provider is istanbul): the reason is in the diff, and the reviewer judges it.

### Positive Consequences

* A pull request that leaves a line or a branch of `src/` untested fails `build`, which `main` already requires ([ADR 0016](0016-protection-rules-for-main-and-release-tags.md))
* The same check runs locally with `pnpm test:coverage`
* The comment of Codecov shows which lines are uncovered

### Negative Consequences

* The threshold is on the whole of `src/`, not on the lines of the pull request: it holds only as long as the library stays at 100%
* Some branches need contrived tests, or an `istanbul ignore` comment
* `pnpm test` does not measure the coverage: only `pnpm test:coverage` fails

## Pros and Cons of the Options

### A: Vitest threshold and informational Codecov

* Good, because it blocks through a check that is already required, and runs offline
* Bad, because a threshold of 100% leaves no room for untestable code without an explicit exception

### B: informational Codecov

* Good, because it needs only a configuration file
* Bad, because it signals but does not stop, and shows nothing when Codecov is down

### C: required `codecov/patch`

* Good, because it measures only the lines of the pull request
* Bad, because an outage or a failed upload blocks every merge, and the check is not available locally

### D: nothing

* Good, because it needs no change
* Bad, because untested code reaches `main` unnoticed
