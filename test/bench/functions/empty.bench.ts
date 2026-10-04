import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { empty, from, Functions } = IterableLinq;
const { cases, sum } = Helpers;

// No size: `empty` has no `small` group.
test('empty: direct', async ({ bench }) => {
	await cases(bench, 'empty/direct')
		.add('native', () => sum([]))
		.add('from([])', () => sum(from<number>([])))
		.add('chain', () => sum(empty<number>()))
		.add('Functions', () => sum(Functions.empty<number>()))
		.run();
});
