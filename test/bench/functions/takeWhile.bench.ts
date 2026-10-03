import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers, sum, N } = Helpers;

const half = N / 2;
const mixed: (number | string)[] = numbers.map(v => (v === half ? 'stop' : v));

function isNumber(value: number | string): value is number {
	return typeof value === 'number';
}

function takeWhileLoop<T>(values: T[], predicate: (value: T) => boolean): T[] {
	const r: T[] = [];
	for (const v of values) {
		if (!predicate(v))
			break;
		r.push(v);
	}
	return r;
}

test('takeWhile: half', async ({ bench }) => {
	await cases(bench, 'takeWhile/half')
		.add('native', () => sum(takeWhileLoop(numbers, v => v < half)))
		.add('chain', () => sum(from(numbers).takeWhile(v => v < half)))
		.add('Functions', () => sum(Functions.takeWhile(numbers, v => v < half)))
		.run();
});

test('takeWhile: type guard', async ({ bench }) => {
	await cases(bench, 'takeWhile/type-guard')
		.add('native', () => sum(takeWhileLoop(mixed, isNumber) as number[]))
		.add('chain', () => sum(from(mixed).takeWhile(isNumber)))
		.add('Functions', () => sum(Functions.takeWhile(mixed, isNumber)))
		.run();
});
