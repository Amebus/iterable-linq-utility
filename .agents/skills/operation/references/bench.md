# Bench skeleton

`test/bench/functions/<name>.bench.ts`. Every group compares a native reference (an array method or a hand-written loop), the chain and the raw function. The scenarios, the data and the report are fixed by [ADR 0021](../../../../docs/decisions/0021-benchmark-standards.md); where and how the benches run by [ADR 0011](../../../../docs/decisions/0011-local-benchmarks-with-a-saved-baseline.md). The template is `test/bench/functions/sum.bench.ts`:

```ts
import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, double, isEven, numbers, small } = Helpers;

test('sum: direct', async ({ bench }) => {
	await cases(bench, 'sum/direct')
		.add('native', () => numbers.reduce((total, v) => total + v, 0))
		.add('chain', () => from(numbers).sum())
		.add('Functions', () => Functions.sum(numbers))
		.run();
});

test('sum: small', async ({ bench }) => {
	await cases(bench, 'sum/small')
		.add('native', () => small.reduce((total, v) => total + v, 0))
		.add('chain', () => from(small).sum())
		.add('Functions', () => Functions.sum(small))
		.run();
});

test('sum: after a map', async ({ bench }) => {
	await cases(bench, 'sum/map')
		.add('native', () => numbers.map(double).reduce((total, v) => total + v, 0))
		.add('chain', () => from(numbers).map(double).sum())
		.add('Functions', () => Functions.sum(Functions.map(numbers, double)))
		.run();
});

test('sum: after a filter', async ({ bench }) => {
	await cases(bench, 'sum/filter')
		.add('native', () => numbers.filter(isEven).reduce((total, v) => total + v, 0))
		.add('chain', () => from(numbers).filter(isEven).sum())
		.add('Functions', () => Functions.sum(Functions.filter(numbers, isEven)))
		.run();
});

test('sum: with selector', async ({ bench }) => {
	await cases(bench, 'sum/selector')
		.add('native', () => numbers.reduce((total, v) => total + double(v), 0))
		.add('chain', () => from(numbers).sum(double))
		.add('Functions', () => Functions.sum(numbers, double))
		.run();
});
```

The standard groups, in this order, each a `test` with the cases `native`, `chain` and `Functions`:

| Group | When |
| --- | --- |
| `<name>/direct` | always, on `numbers` |
| `<name>/small` | always, the direct case on `small` |
| `<name>/map` | the operation reads a source: after `map(double)` |
| `<name>/filter` | the operation reads a source: after `filter(isEven)` |
| `<name>/start`, `/middle`, `/none` | the operation can stop early: it looks for `first`, `middle`, `missing` |
| `<name>/<callback>` | the operation has an optional callback (`direct` is without it) |

- A Transformation is read to the end with the `sum` helper: `sum(from(numbers).map(double))`.
- `records` only for a key or a selector on objects. Free-named groups (`filter/type-guard`) go after the standard ones, only when they measure something the standard ones do not.
- The bench imports the built bundle: `pnpm bench:report functions/<name>` builds it first, runs the bench and prints the report for the pull request.
- For a change that can affect performance, compare with `main`: `git switch main && pnpm bench:baseline`, then `pnpm bench:report functions/<name>` on the branch adds the `vs baseline` column.
