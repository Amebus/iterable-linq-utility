import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers } = Helpers;

const middle = numbers.length / 2;

test('every: rejected at the start', async ({ bench }) => {
	await cases(bench, 'every/start')
		.add('native', () => numbers.every(v => v > 0))
		.add('chain', () => from(numbers).every(v => v > 0))
		.add('Functions', () => Functions.every(numbers, v => v > 0))
		.run();
});

test('every: rejected in the middle', async ({ bench }) => {
	await cases(bench, 'every/middle')
		.add('native', () => numbers.every(v => v < middle))
		.add('chain', () => from(numbers).every(v => v < middle))
		.add('Functions', () => Functions.every(numbers, v => v < middle))
		.run();
});

test('every: all accepted', async ({ bench }) => {
	await cases(bench, 'every/all')
		.add('native', () => numbers.every(v => v >= 0))
		.add('chain', () => from(numbers).every(v => v >= 0))
		.add('Functions', () => Functions.every(numbers, v => v >= 0))
		.run();
});
