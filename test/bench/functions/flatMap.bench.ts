import * as IterableLinq from 'iterable-linq-utility';
import { test } from 'vitest';

import * as Helpers from '../helpers';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers, sum } = Helpers;

// A tenth of the values, so the 10-value inner iterables still give 1e5 values.
const tenth = numbers.slice(0, numbers.length / 10);

function* twice(v: number): Generator<number> {
	yield v;
	yield v;
}

test('flatMap: inner array of 1', async ({ bench }) => {
	await cases(bench, 'flatMap/one')
		.add('native', () => sum(numbers.flatMap(v => [v])))
		.add('chain', () => sum(from(numbers).flatMap(v => [v])))
		.add('Functions', () => sum(Functions.flatMap(numbers, v => [v])))
		.run();
});

test('flatMap: inner array of 10', async ({ bench }) => {
	await cases(bench, 'flatMap/ten')
		.add('native', () => sum(tenth.flatMap(v => [v, v, v, v, v, v, v, v, v, v])))
		.add('chain', () => sum(from(tenth).flatMap(v => [v, v, v, v, v, v, v, v, v, v])))
		.add('Functions', () => sum(Functions.flatMap(tenth, v => [v, v, v, v, v, v, v, v, v, v])))
		.run();
});

test('flatMap: empty inner', async ({ bench }) => {
	await cases(bench, 'flatMap/empty')
		.add('native', () => sum(numbers.flatMap(() => [])))
		.add('chain', () => sum(from(numbers).flatMap(() => [])))
		.add('Functions', () => sum(Functions.flatMap(numbers, () => [])))
		.run();
});

test('flatMap: inner generator', async ({ bench }) => {
	await cases(bench, 'flatMap/generator')
		.add('native nested for…of', () => {
			let s = 0;
			for (const v of numbers) {
				for (const w of twice(v)) {
					s += w;
				}
			}
			return s;
		})
		.add('chain', () => sum(from(numbers).flatMap(twice)))
		.add('Functions', () => sum(Functions.flatMap(numbers, twice)))
		.run();
});
