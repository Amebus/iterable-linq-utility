import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers } = Helpers;

const middle = numbers.length / 2;
const mixed: (number | string)[] = numbers.map(v => (v === middle ? 'found' : v));

function isString(value: number | string): value is string {
	return typeof value === 'string';
}

test('find: match at the start', async ({ bench }) => {
	await cases(bench, 'find/start')
		.add('native', () => numbers.find(v => v === 0))
		.add('chain', () => from(numbers).find(v => v === 0))
		.add('Functions', () => Functions.find(numbers, v => v === 0))
		.run();
});

test('find: match in the middle', async ({ bench }) => {
	await cases(bench, 'find/middle')
		.add('native', () => numbers.find(v => v === middle))
		.add('chain', () => from(numbers).find(v => v === middle))
		.add('Functions', () => Functions.find(numbers, v => v === middle))
		.run();
});

test('find: no match', async ({ bench }) => {
	await cases(bench, 'find/none')
		.add('native', () => numbers.find(v => v < 0))
		.add('chain', () => from(numbers).find(v => v < 0))
		.add('Functions', () => Functions.find(numbers, v => v < 0))
		.run();
});

test('find: type guard', async ({ bench }) => {
	await cases(bench, 'find/type-guard')
		.add('native', () => mixed.find(isString))
		.add('chain', () => from(mixed).find(isString))
		.add('Functions', () => Functions.find(mixed, isString))
		.run();
});
