import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, double, isEven, numbers, small } = Helpers;

test('collectToArray: direct', async ({ bench }) => {
	await cases(bench, 'collectToArray/direct')
		.add('native', () => [...numbers])
		.add('chain', () => from(numbers).collectToArray())
		.add('Functions', () => Functions.collectToArray(numbers))
		.run();
});

test('collectToArray: small', async ({ bench }) => {
	await cases(bench, 'collectToArray/small')
		.add('native', () => [...small])
		.add('chain', () => from(small).collectToArray())
		.add('Functions', () => Functions.collectToArray(small))
		.run();
});

// The array methods already return an array: the native case has no copy.
test('collectToArray: after a map', async ({ bench }) => {
	await cases(bench, 'collectToArray/map')
		.add('native', () => numbers.map(double))
		.add('chain', () => from(numbers).map(double).collectToArray())
		.add('Functions', () => Functions.collectToArray(Functions.map(numbers, double)))
		.run();
});

test('collectToArray: after a filter', async ({ bench }) => {
	await cases(bench, 'collectToArray/filter')
		.add('native', () => numbers.filter(isEven))
		.add('chain', () => from(numbers).filter(isEven).collectToArray())
		.add('Functions', () => Functions.collectToArray(Functions.filter(numbers, isEven)))
		.run();
});

test('collectToArray: Array.from', async ({ bench }) => {
	await cases(bench, 'collectToArray/array-from')
		.add('native', () => Array.from(numbers))
		.add('chain', () => from(numbers).collectToArray())
		.run();
});
