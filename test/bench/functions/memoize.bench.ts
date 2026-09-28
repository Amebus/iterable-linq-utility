import * as IterableLinq from 'iterable-linq-utility';
import { test } from 'vitest';

import * as Helpers from '../helpers';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers, sum } = Helpers;

const partial = { allowPartialMemoization: true };
const full = { allowPartialMemoization: false };

test('memoize: first run', async ({ bench }) => {
	await cases(bench, 'memoize/first')
		.add('without memoize', () => sum(from(numbers)))
		.add('chain, partial', () => sum(from(numbers).memoize(partial)))
		.add('chain, full', () => sum(from(numbers).memoize(full)))
		.add('Functions, partial', () => sum(Functions.memoize(numbers, partial)))
		.run();
});

test('memoize: cached run', async ({ bench }) => {
	const cachedPartial = from(numbers).memoize(partial);
	const cachedFull = from(numbers).memoize(full);
	const materialized = from(numbers).materialize();
	sum(cachedPartial);
	sum(cachedFull);
	await cases(bench, 'memoize/cached')
		.add('from(array)', () => sum(from(numbers)))
		.add('materialized', () => sum(materialized))
		.add('chain, partial', () => sum(cachedPartial))
		.add('chain, full', () => sum(cachedFull))
		.run();
});

test('memoize: partial read', async ({ bench }) => {
	await cases(bench, 'memoize/partialRead')
		.add('without memoize', () => from(numbers).some(v => v === 100))
		.add('chain, partial', () => from(numbers).memoize(partial).some(v => v === 100))
		.add('chain, full', () => from(numbers).memoize(full).some(v => v === 100))
		.run();
});
