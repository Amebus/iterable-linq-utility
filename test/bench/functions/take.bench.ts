import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers, sum, N } = Helpers;

const half = N / 2;

function takeLoop(iterable: Iterable<number>, count: number): number[] {
	const r: number[] = [];
	if (count === 0)
		return r;
	for (const v of iterable) {
		r.push(v);
		if (r.length === count)
			break;
	}
	return r;
}

test('take: half', async ({ bench }) => {
	await cases(bench, 'take/half')
		.add('native', () => sum(numbers.slice(0, half)))
		.add('chain', () => sum(from(numbers).take(half)))
		.add('Functions', () => sum(Functions.take(numbers, half)))
		.run();
});

test('take: more than the source', async ({ bench }) => {
	await cases(bench, 'take/all')
		.add('native', () => sum(numbers.slice(0, N * 2)))
		.add('chain', () => sum(from(numbers).take(N * 2)))
		.add('Functions', () => sum(Functions.take(numbers, N * 2)))
		.run();
});

test('take: after a map', async ({ bench }) => {
	await cases(bench, 'take/map')
		.add('native', () => sum(takeLoop(numbers.values().map(v => v * 2), half)))
		.add('chain', () => sum(from(numbers).map(v => v * 2).take(half)))
		.add('Functions', () => sum(Functions.take(Functions.map(numbers, v => v * 2), half)))
		.run();
});
