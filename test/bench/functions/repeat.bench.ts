import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions, repeat } = IterableLinq;
const { cases, N: n, sum } = Helpers;

const item = { v: 1 };

function sumV(iterable: Iterable<{ v: number }>): number {
	let s = 0;
	for (const o of iterable) {
		s += o.v;
	}
	return s;
}

test('repeat: primitive', async ({ bench }) => {
	await cases(bench, 'repeat/primitive')
		.add('native for', () => {
			let s = 0;
			for (let i = 0; i < n; i++) {
				s += 1;
			}
			return s;
		})
		.add('chain', () => sum(repeat(1, n)))
		.add('Functions', () => sum(Functions.repeat(1, n)))
		.run();
});

test('repeat: object', async ({ bench }) => {
	await cases(bench, 'repeat/object')
		.add('native Array.fill', () => sumV(new Array<{ v: number }>(n).fill(item)))
		.add('chain', () => sumV(repeat(item, n)))
		.add('Functions', () => sumV(Functions.repeat(item, n)))
		.run();
});
