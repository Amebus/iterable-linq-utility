import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers, sum, N } = Helpers;

const quarter = N / 4;

test('slice: non-negative indexes', async ({ bench }) => {
	await cases(bench, 'slice/start-end')
		.add('native', () => sum(numbers.slice(quarter, N - quarter)))
		.add('chain', () => sum(from(numbers).slice(quarter, N - quarter)))
		.add('Functions', () => sum(Functions.slice(numbers, quarter, N - quarter)))
		.run();
});

test('slice: negative end', async ({ bench }) => {
	await cases(bench, 'slice/negative-end')
		.add('native', () => sum(numbers.slice(quarter, -quarter)))
		.add('chain', () => sum(from(numbers).slice(quarter, -quarter)))
		.add('Functions', () => sum(Functions.slice(numbers, quarter, -quarter)))
		.run();
});

test('slice: negative start', async ({ bench }) => {
	await cases(bench, 'slice/negative-start')
		.add('native', () => sum(numbers.slice(-quarter)))
		.add('chain', () => sum(from(numbers).slice(-quarter)))
		.add('Functions', () => sum(Functions.slice(numbers, -quarter)))
		.run();
});

test('slice: negative start, after a map', async ({ bench }) => {
	await cases(bench, 'slice/map')
		.add('native', () => sum(numbers.map(v => v * 2).slice(-quarter)))
		.add('chain', () => sum(from(numbers).map(v => v * 2).slice(-quarter)))
		.add('Functions', () => sum(Functions.slice(Functions.map(numbers, v => v * 2), -quarter)))
		.run();
});
