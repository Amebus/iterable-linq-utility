import * as IterableLinq from 'iterable-linq-utility';
import { test } from 'vitest';

import * as Helpers from '../helpers';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers } = Helpers;

const middle = numbers.length / 2;

test('some: match at the start', async ({ bench }) => {
	await cases(bench, 'some/start')
		.add('native', () => numbers.some(v => v === 0))
		.add('chain', () => from(numbers).some(v => v === 0))
		.add('Functions', () => Functions.some(numbers, v => v === 0))
		.run();
});

test('some: match in the middle', async ({ bench }) => {
	await cases(bench, 'some/middle')
		.add('native', () => numbers.some(v => v === middle))
		.add('chain', () => from(numbers).some(v => v === middle))
		.add('Functions', () => Functions.some(numbers, v => v === middle))
		.run();
});

test('some: no match', async ({ bench }) => {
	await cases(bench, 'some/none')
		.add('native', () => numbers.some(v => v < 0))
		.add('chain', () => from(numbers).some(v => v < 0))
		.add('Functions', () => Functions.some(numbers, v => v < 0))
		.run();
});
