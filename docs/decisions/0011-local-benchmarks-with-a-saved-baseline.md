# Local benchmarks with a saved baseline

* Status: accepted, amended by [ADR 0021](0021-benchmark-standards.md)
* Deciders: Amebus
* Date: 2026-09-28

Technical Story: https://github.com/Amebus/iterable-linq-utility/pull/21

## Context and Problem Statement

The library promises to be lazy and cheap, so performance regressions matter. Before 0.1.0, performance was checked with a hand-written script on one chain, and the numbers were compared by hand. Vitest 5 has a new benchmark API (`bench.compare`, `writeResult`, `bench.from`).

How should the performance of the library be measured and compared between versions?

## Decision Drivers

* Measure what users run: the built bundle, not the TypeScript sources
* Compare a branch with `main` on the same machine
* Put every operation next to a native reference, so that the overhead is visible
* No noisy results that block pull requests

## Considered Options

* A: keep the hand-written script
* B: Vitest benchmarks, with results compared in CI
* C: Vitest benchmarks run locally, with a saved local baseline

## Decision Outcome

Chosen option: "C: Vitest benchmarks run locally, with a saved local baseline".

* The benches are in `test/bench/`: one file per function in `functions/`, and complex chains in `chains/`. Each table has a native reference, the chain and, where it exists, the raw function.
* `pnpm bench` builds the bundle and runs the benches against it (a Vitest alias points `iterable-linq-utility` at `dist/`).
* `pnpm bench:baseline` saves the results to `.bench/`, which is ignored by git. The next `pnpm bench` adds a `(baseline)` row to each table.
* The benches do not run in CI. The README explains the workflow: baseline on `main`, then the bench on the branch.

### Positive Consequences

* The same tool as the tests, with no extra dependency
* Regressions are visible per case, next to the native reference
* The benches already guided three optimisations in 0.1.0 (`collectToArray`, the callback error handling, `flatMap`)

### Negative Consequences

* A regression is found only if someone runs the benches
* Results depend on the machine, so they cannot be shared or compared across machines
* A full run takes a few minutes

## Pros and Cons of the Options

### A: hand-written script

* Good, because it has no dependency
* Bad, because it covers one chain, and the comparison is manual

### B: compared in CI

* Good, because regressions would be found automatically
* Bad, because shared CI runners are noisy: the differences we look for (5–20%) are within their variance
* Bad, because a baseline would have to be stored and kept in step with the runners

### C: local with a saved baseline

* Good, because both runs happen on the same machine, a few minutes apart
* Bad, because it depends on discipline, not on the CI
