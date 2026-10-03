import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers } = Helpers;

function singleNative(values: number[], predicate: (value: number) => boolean): number | undefined {
	const matches = values.filter(predicate);
	if (matches.length > 1)
		throw new Error('more than one value');
	return matches[0];
}

const middle = numbers[numbers.length >> 1];
const one = [middle];

test('single: without predicate', async ({ bench }) => {
	await cases(bench, 'single/without-predicate')
		.add('native', () => singleNative(one, () => true))
		.add('chain', () => from(one).single())
		.add('Functions', () => Functions.single(one))
		.run();
});

test('single: one match in the middle', async ({ bench }) => {
	await cases(bench, 'single/predicate')
		.add('native', () => singleNative(numbers, v => v === middle))
		.add('chain', () => from(numbers).single(v => v === middle))
		.add('Functions', () => Functions.single(numbers, v => v === middle))
		.run();
});
