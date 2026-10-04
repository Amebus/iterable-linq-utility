import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { fromRange, Functions } = IterableLinq;
const { cases, N, small, sum } = Helpers;

const { range } = Functions;
const half = N / 2;
const s = small.length;

function rangeLoop(start: number, end: number, step = 1): number {
	let total = 0;
	for (let i = start; i < end; i += step) {
		total += i;
	}
	return total;
}

// `fromRange` creates a source: no map and filter groups. The native case is a for loop.
test('fromRange: direct', async ({ bench }) => {
	await cases(bench, 'fromRange/direct')
		.add('native', () => rangeLoop(0, N))
		.add('chain', () => sum(fromRange(N)))
		.add('Functions', () => sum(range(N)))
		.run();
});

test('fromRange: small', async ({ bench }) => {
	await cases(bench, 'fromRange/small')
		.add('native', () => rangeLoop(0, s))
		.add('chain', () => sum(fromRange(s)))
		.add('Functions', () => sum(range(s)))
		.run();
});

test('fromRange: step 2', async ({ bench }) => {
	await cases(bench, 'fromRange/step')
		.add('native', () => rangeLoop(0, N, 2))
		.add('chain', () => sum(fromRange(0, N, { step: 2 })))
		.add('Functions', () => sum(range(0, N, { step: 2 })))
		.run();
});

test('fromRange: reverse', async ({ bench }) => {
	await cases(bench, 'fromRange/reverse')
		.add('native', () => {
			let total = 0;
			for (let i = N - 1; i >= 0; i--) {
				total += i;
			}
			return total;
		})
		.add('chain', () => sum(fromRange(N, { reverse: true })))
		.add('Functions', () => sum(range(N, { reverse: true })))
		.run();
});

test('fromRange: decimal step', async ({ bench }) => {
	await cases(bench, 'fromRange/decimal')
		.add('native', () => rangeLoop(0, half, 0.5))
		.add('chain', () => sum(fromRange(0, half, { step: 0.5 })))
		.add('Functions', () => sum(range(0, half, { step: 0.5 })))
		.run();
});
