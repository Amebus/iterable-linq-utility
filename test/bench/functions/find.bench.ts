import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, first, group, middle, missing, numbers, scenarios } = Helpers;

function find(value: number): Helpers.IVariants {
	return {
		native: values => values.find(v => v === value),
		chain: chain => chain.find(v => v === value),
		Functions: values => Functions.find(values, v => v === value)
	};
}

scenarios('find', find(missing));
group('find', 'start', find(first));
group('find', 'middle', find(middle));

const mixed: (number | string)[] = numbers.map(v => (v === middle ? 'found' : v));

function isString(value: number | string): value is string {
	return typeof value === 'string';
}

test('find: type guard', async ({ bench }) => {
	await cases(bench, 'find/type-guard')
		.add('native', () => mixed.find(isString))
		.add('chain', () => from(mixed).find(isString))
		.add('Functions', () => Functions.find(mixed, isString))
		.run();
});
