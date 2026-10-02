import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, unit } = IterableLinq;
const { cases, numbers } = Helpers;

const u = unit();

// Only the cost of building the chain: nothing is iterated.
test('tapChainCreation: build only', async ({ bench }) => {
	await cases(bench, 'tapChainCreation/build')
		.add('without tapChainCreation', () => from(numbers).map(v => v * 2).filter(v => v > 10))
		.add('chain', () => from(numbers).map(v => v * 2).tapChainCreation(() => u).filter(v => v > 10))
		.run();
});
