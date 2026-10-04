# Benchmark standards

* Status: accepted, amended by [ADR 0022](0022-benchmark-scenarios-in-practice.md)
* Deciders: Amebus
* Date: 2026-10-04

Technical Story: https://github.com/Amebus/iterable-linq-utility/issues/156

Amends: [ADR 0011](0011-local-benchmarks-with-a-saved-baseline.md)

## Context and Problem Statement

ADR 0011 decides where and how the benchmarks run, not what they measure or report. As a result:

* the reports in the pull requests used, from one pull request to the next, the mean time in ms, operations per second or the `hz` column of Vitest, with the difference from native sometimes in `%` and sometimes in `×`;
* each `test/bench/functions/<name>.bench.ts` picked its own cases: an operation after a `map` or a `filter` was measured for some operations and not for others, with different callbacks;
* nothing said when to use `numbers`, `small` or `records`.

Two reports could not be compared at a glance, and whoever wrote a bench had to choose its cases. What does a bench measure, and how is it reported?

## Decision Drivers

* Two reports of different pull requests can be compared row by row
* Whoever writes a bench does not choose its cases: the operation decides which standard scenarios apply
* A report shows whether a difference is noise, and on which machine it was measured
* No hand-written numbers: a script writes the report
* A full run stays within a few minutes

## Considered Options

* Measures: ops/s only; ops/s and the mean time; ops/s, the mean time, p75, p99 and the margin of error
* Difference from native: always `%`; `%` below ×2 and `×` above; always `×`
* Report: written by hand in a fixed format; a custom Vitest reporter; a `bench:report` script
* Native reference of the chained cases: the array methods; the Iterator Helpers; both
* Sizes: 100 000 values only; 100 000 values plus a fixed case on 1 000; three sizes for every case

## Decision Outcome

**Report.** `pnpm bench:report <filter>` runs the benchmarks whose path contains the filter and prints the report for the pull request, which is pasted as it is:

* a line with the environment: operating system, architecture, Docker or not, cores, CPU model when visible, the host from `BENCH_HOST` (a container does not see the model of the host CPU), Node, Vitest, `BENCH_TIME` and the commit;
* one table: `case | variant | ops/s | mean (ms) | p75 (ms) | p99 (ms) | rme | vs native`;
* `vs native` is always a `%` of the ops/s of the `native` case of the same group (`+33%`, `-59%`);
* when a case has a baseline in `.bench/`, a `vs baseline` column, in `%`; the `(baseline)` rows are not reported;
* the measure is called ops/s, never `hz`.

The results stay in the descriptions of the pull requests: they depend on the machine, as ADR 0011 says. Whether to publish them in the documentation is discussed in [#161](https://github.com/Amebus/iterable-linq-utility/issues/161).

**Scenarios.** The groups of a bench are named `<name>/<scenario>`, and each has the cases `native` (the array methods or a hand-written loop), `chain` and, where it exists, `Functions`. A Transformation is read to the end with the `sum` helper.

| Scenario | Group | When |
| --- | --- | --- |
| direct | `<name>/direct` | always, on `numbers` |
| small | `<name>/small` | always: the direct case on `small`, to show the fixed cost of the chain and the iterators |
| after a `map` | `<name>/map` | operations that read a source, after `map(double)` |
| after a `filter` | `<name>/filter` | operations that read a source, after `filter(isEven)` |
| early exit | `<name>/start`, `<name>/middle`, `<name>/none` | operations that can stop early: a match at the start, in the middle, never |
| callback | `<name>/<callback>`, for example `sum/selector` | operations with an optional callback; `direct` is without it |

The operations that create a source (`from`, `fromRange`, `repeat`, `empty`) and `tapChainCreation` have no `map` and `filter` scenarios. Other cases, with a free name, come after the standard ones, only when they measure something the standard ones do not (`filter/type-guard`, `concat/ten`).

**Data.** `test/bench/helpers.ts` holds the data and the callbacks of the scenarios:

* `numbers` (`N` = 100 000 integers) for every scenario, `small` (1 000) for `<name>/small`;
* `records` (objects) only for the operations with a key or a selector on objects, such as `distinct`, `min` and `max` by key, `reduce` on objects;
* `double` and `isEven`, the callbacks of the `map` and `filter` scenarios;
* `first`, `middle` and `missing`, the values the early exit scenarios look for.

`pnpm check:structure` checks that every bench of an operation has the `direct` and `small` groups; the review checks the other scenarios.

### Positive Consequences

* Every report has the same columns, the margin of error and the environment
* The same scenario means the same chain, with the same callbacks, in every bench
* The `small` case shows the fixed cost of a chain, which a run on 100 000 values hides

### Negative Consequences

* The existing benches have to be rewritten, and the local baselines saved before that have other group names
* A full run takes longer: every operation gets at least four groups
* The tables are wide: eight or nine columns

## Pros and Cons of the Options

### Measures

* ops/s only: good, because it is what `bench.compare` ranks by; bad, because a single number hides the noise and the tail
* ops/s and the mean time: good, because the mean is easier to relate to a real workload; bad, because it still hides the noise
* all five: good, because `rme` tells whether a difference is noise and p75/p99 show the cost of the garbage collector; bad, because the table is wide

### Difference from native

* always `%`: good, because there is one format to compare; bad, because large gains become large numbers (`+875%`)
* `%` and `×`: good, because large gains are easier to read; bad, because there are two formats
* always `×`: good, because it is uniform; bad, because small differences are harder to read (`×1.04`)

### Report

* by hand: good, because it needs no code; bad, because eight columns and a computed difference are easy to get wrong, which is how the reports drifted
* a custom Vitest reporter: good, because it prints the table at the end of every `pnpm bench`; bad, because it depends on the reporter API of Vitest
* a `bench:report` script: good, because it reads the results Vitest writes with `writeResult` and its formatting is tested; bad, because it runs the benches once more when a plain `pnpm bench` already ran

### Native reference of the chained cases

* the array methods: good, because it is what users write today; bad, because they are eager, so the comparison is not lazy against lazy
* the Iterator Helpers: good, because they are lazy like the library; bad, because they lack many operations (`sum`, `slice`, `at`…), which would need another reference
* both: good, because it shows both comparisons; bad, because the tables get longer, and the lazy comparison is already in `test/bench/chains/`

### Sizes

* 100 000 values only: good, because it is the shortest run; bad, because it hides the fixed cost of a chain
* plus a fixed case on 1 000 values: good, because one more group shows the fixed cost
* three sizes for every case: good, because it shows the whole curve; bad, because it triples a run that already takes minutes
