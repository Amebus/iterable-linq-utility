import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers, scenarios, sum } = Helpers;

const partial = { allowPartialMemoization: true };
const full = { allowPartialMemoization: false };

// An array needs no memoize: the native case reads it.
scenarios('memoize', {
	native: values => sum(values),
	chain: chain => sum(chain.memoize()),
	Functions: values => sum(Functions.memoize(values))
});

test('memoize: full memoization', async ({ bench }) => {
	await cases(bench, 'memoize/full')
		.add('native', () => sum(numbers))
		.add('chain', () => sum(from(numbers).memoize(full)))
		.add('Functions', () => sum(Functions.memoize(numbers, full)))
		.run();
});

test('memoize: cached run', async ({ bench }) => {
	const cachedPartial = from(numbers).memoize(partial);
	const cachedFull = from(numbers).memoize(full);
	const materialized = from(numbers).materialize();
	sum(cachedPartial);
	sum(cachedFull);
	await cases(bench, 'memoize/cached')
		.add('native', () => sum(numbers))
		.add('materialized', () => sum(materialized))
		.add('chain, partial', () => sum(cachedPartial))
		.add('chain, full', () => sum(cachedFull))
		.run();
});

test('memoize: partial read', async ({ bench }) => {
	await cases(bench, 'memoize/partialRead')
		.add('native', () => numbers.some(v => v === 100))
		.add('chain, partial', () => from(numbers).memoize(partial).some(v => v === 100))
		.add('chain, full', () => from(numbers).memoize(full).some(v => v === 100))
		.run();
});
