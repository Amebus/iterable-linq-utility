import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers } = Helpers;

test('collectToArray: from an array', async ({ bench }) => {
	await cases(bench, 'collectToArray/array')
		.add('native spread', () => [...numbers])
		.add('native Array.from', () => Array.from(numbers))
		.add('chain', () => from(numbers).collectToArray())
		.add('Functions', () => Functions.collectToArray(numbers))
		.run();
});

test('collectToArray: after map', async ({ bench }) => {
	await cases(bench, 'collectToArray/map')
		.add('native', () => numbers.map(v => v * 2))
		.add('chain', () => from(numbers).map(v => v * 2).collectToArray())
		.add('Functions', () => Functions.collectToArray(Functions.map(numbers, v => v * 2)))
		.run();
});
