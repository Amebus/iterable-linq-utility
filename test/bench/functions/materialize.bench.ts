import * as IterableLinq from 'iterable-linq-utility';
import { test } from 'vitest';

import * as Helpers from '../helpers';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers, sum } = Helpers;

test('materialize: after map', async ({ bench }) => {
	await cases(bench, 'materialize/map')
		.add('native', () => sum(numbers.map(v => v * 2)))
		.add('chain', () => sum(from(numbers).map(v => v * 2).materialize()))
		.add('from(collectToArray)', () => sum(from(from(numbers).map(v => v * 2).collectToArray())))
		.add('Functions', () => sum(Functions.materialize(Functions.map(numbers, v => v * 2))))
		.run();
});
