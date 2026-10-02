import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { fromRange, Functions } = IterableLinq;
const { cases, N: n, sum } = Helpers;

const { range } = Functions;
const half = n / 2;

test('fromRange: default', async ({ bench }) => {
	await cases(bench, 'fromRange/default')
		.add('native for', () => {
			let s = 0;
			for (let i = 0; i < n; i++) {
				s += i;
			}
			return s;
		})
		.add('chain', () => sum(fromRange(n)))
		.add('Functions', () => sum(range(n)))
		.run();
});

test('fromRange: step 2', async ({ bench }) => {
	await cases(bench, 'fromRange/step')
		.add('native for', () => {
			let s = 0;
			for (let i = 0; i < n; i += 2) {
				s += i;
			}
			return s;
		})
		.add('chain', () => sum(fromRange(0, n, { step: 2 })))
		.add('Functions', () => sum(range(0, n, { step: 2 })))
		.run();
});

test('fromRange: reverse', async ({ bench }) => {
	await cases(bench, 'fromRange/reverse')
		.add('native for', () => {
			let s = 0;
			for (let i = n - 1; i >= 0; i--) {
				s += i;
			}
			return s;
		})
		.add('chain', () => sum(fromRange(n, { reverse: true })))
		.add('Functions', () => sum(range(n, { reverse: true })))
		.run();
});

test('fromRange: decimal step', async ({ bench }) => {
	await cases(bench, 'fromRange/decimal')
		.add('native for', () => {
			let s = 0;
			for (let v = 0; v < half; v += 0.5) {
				s += v;
			}
			return s;
		})
		.add('chain', () => sum(fromRange(0, half, { step: 0.5 })))
		.add('Functions', () => sum(range(0, half, { step: 0.5 })))
		.run();
});
