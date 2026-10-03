import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers, sum } = Helpers;

test('append: one value', async ({ bench }) => {
	await cases(bench, 'append/value')
		.add('native', () => sum([...numbers, 1]))
		.add('chain', () => sum(from(numbers).append(1)))
		.add('Functions', () => sum(Functions.append(numbers, 1)))
		.run();
});

test('append: after a map', async ({ bench }) => {
	await cases(bench, 'append/map')
		.add('native', () => sum([...numbers.values().map(v => v * 2), 1]))
		.add('chain', () => sum(from(numbers).map(v => v * 2).append(1)))
		.add('Functions', () => sum(Functions.append(Functions.map(numbers, v => v * 2), 1)))
		.run();
});
