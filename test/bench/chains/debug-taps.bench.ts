import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, unit } = IterableLinq;
const { cases, numbers, sum } = Helpers;

const u = unit();

// The cost of leaving debug taps in a chain.
test('debug-taps: tap and tapChain on every stage', async ({ bench }) => {
	await cases(bench, 'chains/debug-taps')
		.add('without taps', () => sum(from(numbers)
			.map(v => v * 2)
			.filter(v => v % 3 !== 0)
			.map(v => v + 1)))
		.add('with taps', () => sum(from(numbers)
			.tapChain(() => u)
			.map(v => v * 2)
			.tap(() => u)
			.filter(v => v % 3 !== 0)
			.tap(() => u)
			.map(v => v + 1)
			.tap(() => u)
			.tapChain(() => u)))
		.run();
});
