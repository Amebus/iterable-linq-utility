import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, unit } = IterableLinq;
const { cases, double, isEven, numbers } = Helpers;

const u = unit();

// Only the cost of building the chain: nothing is iterated, so the size of the source does not matter
// and there are no small, map and filter groups. The native case is the same chain without tapChainCreation.
test('tapChainCreation: direct', async ({ bench }) => {
	await cases(bench, 'tapChainCreation/direct')
		.add('native', () => from(numbers).map(double).filter(isEven))
		.add('chain', () => from(numbers).map(double).tapChainCreation(() => u).filter(isEven))
		.run();
});
