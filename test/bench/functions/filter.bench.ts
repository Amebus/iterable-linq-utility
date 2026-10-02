import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers, sum } = Helpers;

test('filter: keeps all', async ({ bench }) => {
	await cases(bench, 'filter/all')
		.add('native', () => sum(numbers.filter(v => v >= 0)))
		.add('chain', () => sum(from(numbers).filter(v => v >= 0)))
		.add('Functions', () => sum(Functions.filter(numbers, v => v >= 0)))
		.run();
});

test('filter: keeps half', async ({ bench }) => {
	await cases(bench, 'filter/half')
		.add('native', () => sum(numbers.filter(v => v % 2 === 0)))
		.add('chain', () => sum(from(numbers).filter(v => v % 2 === 0)))
		.add('Functions', () => sum(Functions.filter(numbers, v => v % 2 === 0)))
		.run();
});

test('filter: keeps none', async ({ bench }) => {
	await cases(bench, 'filter/none')
		.add('native', () => sum(numbers.filter(v => v < 0)))
		.add('chain', () => sum(from(numbers).filter(v => v < 0)))
		.add('Functions', () => sum(Functions.filter(numbers, v => v < 0)))
		.run();
});
