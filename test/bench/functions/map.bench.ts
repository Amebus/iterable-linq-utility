import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers, sum } = Helpers;

function sumV(iterable: Iterable<{ v: number }>): number {
	let s = 0;
	for (const o of iterable) {
		s += o.v;
	}
	return s;
}

test('map: number', async ({ bench }) => {
	await cases(bench, 'map/number')
		.add('native', () => sum(numbers.map(v => v * 2)))
		.add('chain', () => sum(from(numbers).map(v => v * 2)))
		.add('Functions', () => sum(Functions.map(numbers, v => v * 2)))
		.run();
});

test('map: object creation', async ({ bench }) => {
	await cases(bench, 'map/object')
		.add('native', () => sumV(numbers.map(v => ({ v }))))
		.add('chain', () => sumV(from(numbers).map(v => ({ v }))))
		.add('Functions', () => sumV(Functions.map(numbers, v => ({ v }))))
		.run();
});

test('map: with index', async ({ bench }) => {
	await cases(bench, 'map/index')
		.add('native', () => sum(numbers.map((v, i) => v + i)))
		.add('chain', () => sum(from(numbers).map((v, i) => v + i)))
		.add('Functions', () => sum(Functions.map(numbers, (v, i) => v + i)))
		.run();
});
