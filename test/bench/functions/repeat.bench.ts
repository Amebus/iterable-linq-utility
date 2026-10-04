import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions, repeat } = IterableLinq;
const { cases, N, small, sum } = Helpers;

const item = { v: 1 };
const s = small.length;

function sumV(iterable: Iterable<{ v: number }>): number {
	let total = 0;
	for (const o of iterable) {
		total += o.v;
	}
	return total;
}

function repeatLoop(count: number): number {
	let total = 0;
	for (let i = 0; i < count; i++) {
		total += 1;
	}
	return total;
}

// `repeat` creates a source: no map and filter groups.
test('repeat: direct', async ({ bench }) => {
	await cases(bench, 'repeat/direct')
		.add('native', () => sum(new Array<number>(N).fill(1)))
		.add('loop', () => repeatLoop(N))
		.add('chain', () => sum(repeat(1, N)))
		.add('Functions', () => sum(Functions.repeat(1, N)))
		.run();
});

test('repeat: small', async ({ bench }) => {
	await cases(bench, 'repeat/small')
		.add('native', () => sum(new Array<number>(s).fill(1)))
		.add('loop', () => repeatLoop(s))
		.add('chain', () => sum(repeat(1, s)))
		.add('Functions', () => sum(Functions.repeat(1, s)))
		.run();
});

test('repeat: object', async ({ bench }) => {
	await cases(bench, 'repeat/object')
		.add('native', () => sumV(new Array<{ v: number }>(N).fill(item)))
		.add('chain', () => sumV(repeat(item, N)))
		.add('Functions', () => sumV(Functions.repeat(item, N)))
		.run();
});
