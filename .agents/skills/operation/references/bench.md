# Bench skeleton

`test/bench/functions/<name>.bench.ts`. Every case compares a native reference (an array method or a hand-written loop), the chain and the raw function. See [ADR 0011](../../../../docs/decisions/0011-local-benchmarks-with-a-saved-baseline.md) and the Benchmarks section of the README.

```ts
import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers, sum } = Helpers;

test('map: number', async ({ bench }) => {
	await cases(bench, 'map/number')
		.add('native', () => sum(numbers.map(v => v * 2)))
		.add('chain', () => sum(from(numbers).map(v => v * 2)))
		.add('Functions', () => sum(Functions.map(numbers, v => v * 2)))
		.run();
});
```

- One `test` per variant (overload, option, data shape); the `cases` id is `<name>/<variant>`.
- The bench imports the built bundle: `pnpm bench functions/<name>` builds it first.
- For a change that can affect performance, compare with `main`: `git switch main && pnpm bench:baseline`, then `pnpm bench` on the branch.
