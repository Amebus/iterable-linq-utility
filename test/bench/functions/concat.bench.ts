import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers, sum, N } = Helpers;

const half = N / 2;
const first = numbers.slice(0, half);
const second = numbers.slice(half);
const tenths = Array.from({ length: 10 }, (_, i) => numbers.slice(i * N / 10, (i + 1) * N / 10));
const [head, ...rest] = tenths;

test('concat: two arrays', async ({ bench }) => {
	await cases(bench, 'concat/two')
		.add('native', () => sum(first.concat(second)))
		.add('chain', () => sum(from(first).concat(second)))
		.add('Functions', () => sum(Functions.concat(first, second)))
		.run();
});

test('concat: ten arrays', async ({ bench }) => {
	await cases(bench, 'concat/ten')
		.add('native', () => sum(head.concat(...rest)))
		.add('chain', () => sum(from(head).concat(...rest)))
		.add('Functions', () => sum(Functions.concat(head, ...rest)))
		.run();
});

test('concat: after a map', async ({ bench }) => {
	await cases(bench, 'concat/map')
		.add('native', () => sum(first.map(v => v * 2).concat(second)))
		.add('chain', () => sum(from(first).map(v => v * 2).concat(second)))
		.add('Functions', () => sum(Functions.concat(Functions.map(first, v => v * 2), second)))
		.run();
});
