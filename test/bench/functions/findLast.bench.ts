import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, group, middle, missing, N, numbers, scenarios } = Helpers;

function findLast(value: number): Helpers.IVariants {
	return {
		native: values => values.findLast(v => v === value),
		chain: chain => chain.findLast(v => v === value),
		Functions: values => Functions.findLast(values, v => v === value)
	};
}

// findLast reads the whole source; the native method reads the array from the end, so it stops early
scenarios('findLast', findLast(missing));
group('findLast', 'end', findLast(N - 1));
group('findLast', 'middle', findLast(middle));

const mixed: (number | string)[] = numbers.map(v => (v === middle ? 'found' : v));

function isString(value: number | string): value is string {
	return typeof value === 'string';
}

test('findLast: type guard', async ({ bench }) => {
	await cases(bench, 'findLast/type-guard')
		.add('native', () => mixed.findLast(isString))
		.add('chain', () => from(mixed).findLast(isString))
		.add('Functions', () => Functions.findLast(mixed, isString))
		.run();
});
