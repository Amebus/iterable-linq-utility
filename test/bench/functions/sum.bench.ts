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
