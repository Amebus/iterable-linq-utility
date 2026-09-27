import * as IterableLinq from 'iterable-linq-utility';
import { test } from 'vitest';

import * as Helpers from '../helpers';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions, unit } = IterableLinq;
const { cases, numbers, sum } = Helpers;

const u = unit();

test('tapChain: no-op', async ({ bench }) => {
	await cases(bench, 'tapChain/noop')
		.add('without tapChain', () => sum(from(numbers)))
		.add('chain', () => sum(from(numbers).tapChain(() => u)))
		.add('Functions', () => sum(Functions.tapChain(numbers, () => u)))
		.run();
});
