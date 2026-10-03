import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers, sum } = Helpers;

test('prepend: one value', async ({ bench }) => {
	await cases(bench, 'prepend/value')
		.add('native', () => sum([1, ...numbers]))
		.add('chain', () => sum(from(numbers).prepend(1)))
		.add('Functions', () => sum(Functions.prepend(numbers, 1)))
		.run();
});

test('prepend: after a map', async ({ bench }) => {
	await cases(bench, 'prepend/map')
		.add('native', () => sum([1, ...numbers.values().map(v => v * 2)]))
		.add('chain', () => sum(from(numbers).map(v => v * 2).prepend(1)))
		.add('Functions', () => sum(Functions.prepend(Functions.map(numbers, v => v * 2), 1)))
		.run();
});
