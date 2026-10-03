import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers } = Helpers;

test('average: without selector', async ({ bench }) => {
	await cases(bench, 'average/without-selector')
		.add('native', () => numbers.reduce((total, v) => total + v, 0) / numbers.length)
		.add('chain', () => from(numbers).average())
		.add('Functions', () => Functions.average(numbers))
		.run();
});

test('average: with selector', async ({ bench }) => {
	await cases(bench, 'average/selector')
		.add('native', () => numbers.reduce((total, v) => total + v * 2, 0) / numbers.length)
		.add('chain', () => from(numbers).average(v => v * 2))
		.add('Functions', () => Functions.average(numbers, v => v * 2))
		.run();
});

test('average: after a filter', async ({ bench }) => {
	await cases(bench, 'average/filter')
		.add('native', () => {
			const evens = numbers.filter(v => v % 2 === 0);
			return evens.reduce((total, v) => total + v, 0) / evens.length;
		})
		.add('chain', () => from(numbers).filter(v => v % 2 === 0).average())
		.add('Functions', () => Functions.average(Functions.filter(numbers, v => v % 2 === 0)))
		.run();
});
