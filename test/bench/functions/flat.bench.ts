import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers, small, sum } = Helpers;

function chunks(values: number[], size: number): number[][] {
	const result: number[][] = [];
	for (let i = 0; i < values.length; i += size)
		result.push(values.slice(i, i + size));
	return result;
}

const nested = chunks(numbers, 10);
const nestedSmall = chunks(small, 10);
// three levels: arrays of 10 arrays of 10 values
const deep = chunks(numbers, 100).map(values => chunks(values, 10));

test('flat: direct', async ({ bench }) => {
	await cases(bench, 'flat/direct')
		.add('native', () => sum(nested.flat()))
		.add('chain', () => sum(from(nested).flat()))
		.add('Functions', () => sum(Functions.flat(nested)))
		.run();
});

test('flat: small', async ({ bench }) => {
	await cases(bench, 'flat/small')
		.add('native', () => sum(nestedSmall.flat()))
		.add('chain', () => sum(from(nestedSmall).flat()))
		.add('Functions', () => sum(Functions.flat(nestedSmall)))
		.run();
});

const pair = (v: number): number[] => [v, v];

test('flat: after a map', async ({ bench }) => {
	await cases(bench, 'flat/map')
		.add('native', () => sum(numbers.map(pair).flat()))
		.add('chain', () => sum(from(numbers).map(pair).flat()))
		.add('Functions', () => sum(Functions.flat(Functions.map(numbers, pair))))
		.run();
});

// no filter group: flat after a filter reads the same values as on the source

test('flat: depth Infinity on three levels', async ({ bench }) => {
	await cases(bench, 'flat/depth-infinity')
		.add('native', () => sum(deep.flat(Infinity) as number[]))
		.add('chain', () => sum(from(deep).flat(Infinity) as Iterable<number>))
		.add('Functions', () => sum(Functions.flat(deep, Infinity) as Iterable<number>))
		.run();
});
