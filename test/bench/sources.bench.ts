import { from, fromRange, repeat } from 'iterable-linq-utility';
import { test } from 'vitest';

import { measure, sum, values } from './helpers';

// Local copies: imported bindings go through a module runner getter on every read.
const n = values.length;

test('sources', async ({ bench }) => {
	await bench.compare(
		...measure(bench, 'sources', 'native for loop', () => {
			let s = 0;
			for (let i = 0; i < n; i++) {
				s += i;
			}
			return s;
		}),
		...measure(bench, 'sources', 'from(array)', () => sum(from(values))),
		...measure(bench, 'sources', 'fromRange', () => sum(fromRange(n))),
		...measure(bench, 'sources', 'repeat', () => sum(repeat(1, n)))
	);
});
