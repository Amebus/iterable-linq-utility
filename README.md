| | |
| --- | --- |
| **Package** | [![npm version](https://img.shields.io/npm/v/iterable-linq-utility.svg)](https://npmjs.org/package/iterable-linq-utility) [![npm downloads](https://img.shields.io/npm/dm/iterable-linq-utility.svg)](https://npmjs.org/package/iterable-linq-utility) [![jsDelivr hits](https://data.jsdelivr.com/v1/package/npm/iterable-linq-utility/badge)](https://www.jsdelivr.com/package/npm/iterable-linq-utility) |
| **Quality** | [![CI status](https://github.com/Amebus/iterable-linq-utility/actions/workflows/build-test.yml/badge.svg?branch=main&event=push)](https://github.com/Amebus/iterable-linq-utility/actions/workflows/build-test.yml?query=branch%3Amain+event%3Apush) [![Coverage](https://codecov.io/gh/Amebus/iterable-linq-utility/branch/main/graph/badge.svg)](https://codecov.io/gh/Amebus/iterable-linq-utility) |
| **Activity** | [![Commits since the latest release](https://img.shields.io/github/commits-since/Amebus/iterable-linq-utility/latest)](https://amebus.github.io/iterable-linq-utility/next/) [![Latest release date](https://img.shields.io/github/release-date/Amebus/iterable-linq-utility)](https://github.com/Amebus/iterable-linq-utility/releases/latest) [![Open issues](https://img.shields.io/github/issues/Amebus/iterable-linq-utility)](https://github.com/Amebus/iterable-linq-utility/issues) [![Open pull requests](https://img.shields.io/github/issues-pr/Amebus/iterable-linq-utility)](https://github.com/Amebus/iterable-linq-utility/pulls) |
| **Community** | [![GitHub stars](https://img.shields.io/github/stars/Amebus/iterable-linq-utility)](https://github.com/Amebus/iterable-linq-utility/stargazers) [![Forks](https://img.shields.io/github/forks/Amebus/iterable-linq-utility)](https://github.com/Amebus/iterable-linq-utility/forks) |

Lazy, re-runnable operations on JavaScript iterables, inspired by [.NET LINQ to Objects](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/linq/linq-to-objects) with JavaScript names (`Select` is `map`, `Aggregate` is `reduce`), and some new features, like [memoize](https://amebus.github.io/iterable-linq-utility/latest/api-reference/transformations/#memoize) and [materialize](https://amebus.github.io/iterable-linq-utility/latest/api-reference/actions/#materialize).

## Installation

```sh
npm install iterable-linq-utility
```

## Usage

```ts
import * as IterableLinq from 'iterable-linq-utility';

const chain = IterableLinq
	.from([1, 2, 3, 4, 5, 6])
	.filter(v => v % 2 === 0)
	.map(v => v * 10);   // nothing runs yet

chain.collectToArray();  // [20, 40, 60]
chain.max();             // 60: the same chain runs again
```

## Documentation

The [documentation site](https://amebus.github.io/iterable-linq-utility/latest/) has the details:

- [Getting Started](https://amebus.github.io/iterable-linq-utility/latest/getting-started/): installation from npm or a CDN, and the module formats;
- [Basic Concepts](https://amebus.github.io/iterable-linq-utility/latest/basic-concepts/): actions, transformations and taps, deferred execution, equality, selectors;
- [API Reference](https://amebus.github.io/iterable-linq-utility/latest/api-reference/): every operation, on the chain and as a raw function in `Functions`;
- [Changelog](https://amebus.github.io/iterable-linq-utility/latest/changelog/) and the migration guides;
- [How to contribute](https://amebus.github.io/iterable-linq-utility/latest/how-to-contribute/).

## Benchmarks

The benchmarks use [Vitest benchmarking](https://vitest.dev/guide/benchmarking) and live in `test/bench`:

- `functions/`: one file for each function, with several variants (for example `min` with no comparer, a compare function, a key and a list of keys);
- `chains/`: whole chains, from `map(filter(range))` to multi-stage pipelines, early exits and chains read by more than one action.

Every table compares the library with a native reference (an array method or a hand-written loop) and, where it exists, with the raw function in `Functions`.

The benchmarks measure the built bundle (`dist/iterable-linq-utility.js`), the same code that users run. The `bench` scripts build it first.

### Run

```sh
pnpm bench                        # every benchmark, about 3 minutes
pnpm bench functions/min          # only the files whose path contains "functions/min"
pnpm bench chains                 # only the chains
BENCH_TIME=1000 pnpm bench        # more time for each case (default 500 ms): more samples, less noise
```

### Report

A pull request that adds an operation or changes its performance pastes the report in its description, as it is:

```sh
pnpm bench:report functions/sum                       # the same filter as pnpm bench
BENCH_HOST="MacBook Pro M3" pnpm bench:report functions/sum   # names the host, which a container cannot see
```

```text
Environment: Alpine Linux v3.24 (Docker), arm64, 12 cores, CPU unknown · host MacBook Pro M3 · Node v24.20.0 · Vitest 5.0.2 · BENCH_TIME 500 ms · commit 2fba44d

| case | variant | ops/s | mean (ms) | p75 (ms) | p99 (ms) | rme | vs native |
| --- | --- | --- | --- | --- | --- | --- | --- |
| sum/map | native | 567 | 1.79 | 1.76 | 3.64 | ±2.5% | — |
| sum/map | chain | 855 | 1.2 | 1.26 | 1.76 | ±1.8% | +51% |
```

`vs native` compares the ops/s with the `native` case of the same group. When a baseline exists, a `vs baseline` column compares them with it. [ADR 0021](docs/decisions/0021-benchmark-standards.md) explains the format.

### Find regressions

A baseline is a saved run. Each table shows it as extra rows, marked `(baseline)`, next to the new run.

```sh
git switch main
pnpm bench:baseline               # saves every result in .bench/
git switch my-branch
pnpm bench                        # shows each case next to its "(baseline)" row
pnpm bench:report functions/sum   # or the report, with a "vs baseline" column
```

The timings depend on the machine, so `.bench/` is not committed and the benchmarks do not run in CI. Create the baseline and the new run on the same machine, with the same load.

### Read the tables

| Column | Meaning |
|---|---|
| `hz` | runs per second (ops/s in the report): higher is faster |
| `mean`, `p75`, `p99` | time of one run, in ms |
| `rme` | relative margin of error |
| `samples` | how many runs were measured |

A difference smaller than the `rme` of the two rows is noise.

### Add a benchmark

Create `test/bench/functions/<name>.bench.ts`. `scenarios()` registers the standard groups of [ADR 0021](docs/decisions/0021-benchmark-standards.md) and [ADR 0022](docs/decisions/0022-benchmark-scenarios-in-practice.md): `<name>/direct` on `numbers`, `<name>/small` on `small`, `<name>/map` and `<name>/filter` after `map(double)` and `filter(isEven)`. `group()` adds one more group on `numbers`: an early exit (`start`, `middle`) or an optional callback.

```ts
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { double, scenarios, sum } = Helpers;

scenarios('map', {
	native: values => sum(values.map(double)),       // an array
	chain: chain => sum(chain.map(double)),          // a chain
	Functions: values => sum(Functions.map(values, double))   // an iterable
});
```

- `native` is the array method a user would write. Add `loop`, a hand-written `for…of`, when the array method is a different algorithm (`reduce` for `sum`); when there is no array method, `native` is the loop.
- `pnpm check:structure` fails when the bench of an operation has no `direct` or `small` group. `test/bench/functions/sum.bench.ts` is the example.
- The benches of `test/bench/chains/<scenario>.bench.ts`, and the groups that need other data, use `cases(bench, '<function>/<group>')` directly: the id is also the baseline folder.

- Every table needs at least two cases: add a native reference.
- Import the library and the helpers as namespaces and copy the exports into local constants, as above. Vitest prints a `Benchmark Warning` when a benchmark reads an imported binding too many times.
- The shared data is in `test/bench/helpers.ts`: `numbers` (100,000 integers) for every scenario, `small` (1,000 integers) for `<name>/small`, `records` (100,000 objects) only for a key or a selector on objects. The callbacks and values of the scenarios are there too: `double`, `isEven`, `first`, `middle`, `missing`.
