import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers } = Helpers;

const middle = numbers.length / 2;

test('findIndex: match at the start', async ({ bench }) => {
	await cases(bench, 'findIndex/start')
		.add('native', () => numbers.findIndex(v => v === 0))
		.add('chain', () => from(numbers).findIndex(v => v === 0))
		.add('Functions', () => Functions.findIndex(numbers, v => v === 0))
		.run();
});

test('findIndex: match in the middle', async ({ bench }) => {
	await cases(bench, 'findIndex/middle')
		.add('native', () => numbers.findIndex(v => v === middle))
		.add('chain', () => from(numbers).findIndex(v => v === middle))
		.add('Functions', () => Functions.findIndex(numbers, v => v === middle))
		.run();
});

test('findIndex: no match', async ({ bench }) => {
	await cases(bench, 'findIndex/none')
		.add('native', () => numbers.findIndex(v => v < 0))
		.add('chain', () => from(numbers).findIndex(v => v < 0))
		.add('Functions', () => Functions.findIndex(numbers, v => v < 0))
		.run();
});
