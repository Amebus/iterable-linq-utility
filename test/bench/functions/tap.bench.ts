import * as IterableLinq from 'iterable-linq-utility';
import { test } from 'vitest';

import * as Helpers from '../helpers';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions, unit } = IterableLinq;
const { cases, numbers, sum } = Helpers;

const u = unit();

test('tap: no-op', async ({ bench }) => {
	await cases(bench, 'tap/noop')
		.add('without tap', () => sum(from(numbers)))
		.add('chain', () => sum(from(numbers).tap(() => u)))
		.add('Functions', () => sum(Functions.tap(numbers, () => u)))
		.run();
});

test('tap: reads the values', async ({ bench }) => {
	let seen = 0;
	await cases(bench, 'tap/read')
		.add('native for…of', () => {
			let s = 0;
			for (const v of numbers) {
				seen += v;
				s += v;
			}
			return s;
		})
		.add('chain', () => sum(from(numbers).tap(v => {
			seen += v;
			return u;
		})))
		.run();
	return seen;
});
