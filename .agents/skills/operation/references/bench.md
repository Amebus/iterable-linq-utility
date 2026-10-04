# Bench skeleton

`test/bench/functions/<name>.bench.ts`. Every group compares a native reference, the chain and the raw function. The scenarios, the data and the report are fixed by [ADR 0021](../../../../docs/decisions/0021-benchmark-standards.md) and [ADR 0022](../../../../docs/decisions/0022-benchmark-scenarios-in-practice.md); where and how the benches run by [ADR 0011](../../../../docs/decisions/0011-local-benchmarks-with-a-saved-baseline.md). The template is `test/bench/functions/sum.bench.ts`:

```ts
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { double, group, scenarios, sum } = Helpers;

scenarios('sum', {
	native: values => values.reduce((total, v) => total + v, 0),
	loop: values => sum(values),
	chain: chain => chain.sum(),
	Functions: values => Functions.sum(values)
});

group('sum', 'selector', {
	native: values => values.reduce((total, v) => total + double(v), 0),
	loop: values => sum(values.values().map(double)),
	chain: chain => chain.sum(double),
	Functions: values => Functions.sum(values, double)
});
```

`scenarios(name, variants)` registers the standard groups, `group(name, id, variants)` one more group on `numbers`. Each variant gets the source of the scenario: `native` and `loop` an array, `chain` a chain, `Functions` an iterable (and the name of the scenario, for data that must match the source, as in `sequenceEqual.bench.ts`).

| Group | Registered by | When |
| --- | --- | --- |
| `<name>/direct` | `scenarios` | always, on `numbers` |
| `<name>/small` | `scenarios` | always, on `small` (not for `empty`) |
| `<name>/map` | `scenarios` | the operation reads a source: after `map(double)` |
| `<name>/filter` | `scenarios` | the operation reads a source: after `filter(isEven)` |
| `<name>/start`, `<name>/middle` | `group` | the operation can stop early: it stops at `first`, at `middle`; `direct` reads the whole source (`missing`, or beyond the end) |
| `<name>/<callback>` | `group` | the operation has an optional callback; `direct` is without it, unless the operation without it reads nothing (`some`, `single`: then `<name>/without-<callback>`) |

- `native` is the array method a user would write; add `loop`, a hand-written `for…of`, when the array method is a different algorithm (`reduce` for `sum`). When there is no array method, `native` is the loop. See `takeWhile.bench.ts` and `forEach.bench.ts`.
- A Transformation is read to the end with the `sum` helper: `chain => sum(chain.take(count))`.
- The operations that create a source (`from`, `fromRange`, `repeat`, `empty`) and the groups that need other data (`records`, a type guard) use `cases` directly, with the same group names. Free-named groups go after the standard ones, only when they measure something the standard ones do not.
- `pnpm check:structure` checks that the bench has the `direct` and `small` groups.
- `pnpm bench:report functions/<name>` builds the bundle, runs the bench and prints the report for the pull request.
- For a change that can affect performance, compare with `main`: `git switch main && pnpm bench:baseline`, then `pnpm bench:report functions/<name>` on the branch adds the `vs baseline` column.
