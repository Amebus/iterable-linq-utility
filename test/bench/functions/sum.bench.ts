import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers } = Helpers;

test('sum: without selector', async ({ bench }) => {
	await cases(bench, 'sum/without-selector')
		.add('native', () => numbers.reduce((total, v) => total + v, 0))
		.add('chain', () => from(numbers).sum())
		.add('Functions', () => Functions.sum(numbers))
		.run();
});

test('sum: with selector', async ({ bench }) => {
	await cases(bench, 'sum/selector')
		.add('native', () => numbers.reduce((total, v) => total + v * 2, 0))
		.add('chain', () => from(numbers).sum(v => v * 2))
		.add('Functions', () => Functions.sum(numbers, v => v * 2))
		.run();
});

test('sum: after a filter', async ({ bench }) => {
	await cases(bench, 'sum/filter')
		.add('native', () => numbers.filter(v => v % 2 === 0).reduce((total, v) => total + v, 0))
		.add('chain', () => from(numbers).filter(v => v % 2 === 0).sum())
		.add('Functions', () => Functions.sum(Functions.filter(numbers, v => v % 2 === 0)))
		.run();
});
