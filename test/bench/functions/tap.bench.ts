import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions, unit } = IterableLinq;
const { cases, numbers, scenarios, sum } = Helpers;

const u = unit();
let seen = 0;

function read(v: number): typeof u {
	seen += v;
	return u;
}

// No array method reads the values on the way: the native case is a loop.
scenarios('tap', {
	native: values => {
		let s = 0;
		for (const v of values) {
			read(v);
			s += v;
		}
		return s;
	},
	chain: chain => sum(chain.tap(read)),
	Functions: values => sum(Functions.tap(values, read))
});

test('tap: no-op', async ({ bench }) => {
	await cases(bench, 'tap/noop')
		.add('native', () => sum(numbers))
		.add('chain', () => sum(from(numbers).tap(() => u)))
		.add('Functions', () => sum(Functions.tap(numbers, () => u)))
		.run();
	return seen;
});
