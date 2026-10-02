# Test skeletons

Write the tests before the code, run them and watch them fail. Look at `test/functions/map.spec.ts` (Transformation) and `test/functions/some.spec.ts` (Action) for complete examples.

The imports: `vitest`, the test helpers (`../_helpers/…`), a blank line, the code under test (`@/…`), the local utilities (`./…`), each group in alphabetical order. `pnpm lint` checks it and `pnpm lint-fix` sorts them.

## Raw function: `test/functions/<name>.spec.ts`

```ts
import { describe, expect, test } from 'vitest';
import { closableSource } from '../_helpers/closableSource';
import { expectTransformation } from '../_helpers/operationKind'; // or expectAction

import { collectToArray, map, range } from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

describe('map', () => {

	test('map without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(map);
	});

	test('is a Transformation', () => {
		expectTransformation(source => map(source, v => v * 10));
	});

	test('return() closes the source', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		const it = map(iterable, v => v)[Symbol.iterator]();
		it.next();
		it.return!();
		expect(state.closed).toBe(true);
	});

	test.each([
		{ start: 0, end: 5, expected: [0, 10, 20, 30, 40] }
	])('map(range($start, $end)) -> $expected', ({ start, end, expected }) => {
		expect(collectToArray(map(range(start, end), v => v * 10))).toEqual(expected);
	});

});
```

Cover, as they apply:

- input validation: a missing iterable, a callback that is not a function;
- Transformation or Action (`expectTransformation` / `expectAction` from `test/_helpers/operationKind.ts`);
- a Transformation runs again on every consumption (re-run);
- the source is closed on `return()`, on an early stop and when a callback throws (`closableSource`), and the callback error propagates unchanged;
- an operation that can stop early stops on an infinite source and reads only what it needs (`infiniteSource` from `test/_helpers/generators/infiniteSource.ts`, `stats.reads`);
- the results, with `test.each` tables, including the empty source.

## Chain method: `test/linqIterableWrapper/<name>.spec.ts`

```ts
import { describe, expect, test } from 'vitest';

import * as IterableLinq from '@/index';
import { withoutInputFunctionThrowsException } from './linqIterableWrapperTestUtility';

describe('IterableLinq.map', () => {

	test('IterableLinq.map without mapper -> throw exception', () => {
		withoutInputFunctionThrowsException(IterableLinq.fromRange(0, 20), 'map');
	});

	test.each([
		{ start: 0, end: 5, expected: [0, 10, 20, 30, 40] }
	])('IterableLinq.fromRange($start, $end).map(v => v * 10) -> $expected', ({ start, end, expected }) => {
		expect(IterableLinq.fromRange(start, end).map(v => v * 10).collectToArray()).toEqual(expected);
	});

});
```
