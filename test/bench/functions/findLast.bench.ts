import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers } = Helpers;

const middle = numbers.length / 2;
const last = numbers.length - 1;
const mixed: (number | string)[] = numbers.map(v => (v === middle ? 'found' : v));

function isString(value: number | string): value is string {
	return typeof value === 'string';
}

for (const { variant, value } of [
	{ variant: 'end', value: last },
	{ variant: 'middle', value: middle },
	{ variant: 'none', value: -1 }
]) {
	test(`findLast: ${variant}`, async ({ bench }) => {
		await cases(bench, `findLast/${variant}`)
			.add('native', () => numbers.findLast(v => v === value))
			.add('chain', () => from(numbers).findLast(v => v === value))
			.add('Functions', () => Functions.findLast(numbers, v => v === value))
			.run();
	});
}

test('findLast: type guard', async ({ bench }) => {
	await cases(bench, 'findLast/type-guard')
		.add('native', () => mixed.findLast(isString))
		.add('chain', () => from(mixed).findLast(isString))
		.add('Functions', () => Functions.findLast(mixed, isString))
		.run();
});
