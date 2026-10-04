import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, N, numbers, scenarios, small, sum } = Helpers;

// every scenario appends `small`: the cost of moving to a second source
scenarios('concat', {
	native: values => sum(values.concat(small)),
	chain: chain => sum(chain.concat(small)),
	Functions: values => sum(Functions.concat(values, small))
});

const tenths = Array.from({ length: 10 }, (_, i) => numbers.slice(i * N / 10, (i + 1) * N / 10));
const [head, ...rest] = tenths;

test('concat: ten arrays', async ({ bench }) => {
	await cases(bench, 'concat/ten')
		.add('native', () => sum(head.concat(...rest)))
		.add('chain', () => sum(from(head).concat(...rest)))
		.add('Functions', () => sum(Functions.concat(head, ...rest)))
		.run();
});
