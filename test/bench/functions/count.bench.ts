import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers } = Helpers;

function countLoop(iterable: Iterable<number>, predicate: (value: number) => boolean = () => true): number {
	let r = 0;
	for (const v of iterable) {
		if (predicate(v))
			r++;
	}
	return r;
}

test('count: without predicate', async ({ bench }) => {
	await cases(bench, 'count/without-predicate')
		.add('native', () => countLoop(numbers))
		.add('chain', () => from(numbers).count())
		.add('Functions', () => Functions.count(numbers))
		.run();
});

test('count: with predicate', async ({ bench }) => {
	await cases(bench, 'count/predicate')
		.add('native', () => countLoop(numbers, v => v % 2 === 0))
		.add('chain', () => from(numbers).count(v => v % 2 === 0))
		.add('Functions', () => Functions.count(numbers, v => v % 2 === 0))
		.run();
});

test('count: after a filter', async ({ bench }) => {
	await cases(bench, 'count/filter')
		.add('native', () => numbers.filter(v => v % 2 === 0).length)
		.add('chain', () => from(numbers).filter(v => v % 2 === 0).count())
		.add('Functions', () => Functions.count(Functions.filter(numbers, v => v % 2 === 0)))
		.run();
});
