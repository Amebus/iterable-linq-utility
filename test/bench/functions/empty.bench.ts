import * as IterableLinq from 'iterable-linq-utility';
import { test } from 'vitest';

import * as Helpers from '../helpers';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { empty, from, Functions } = IterableLinq;
const { cases, sum } = Helpers;

test('empty: create and iterate', async ({ bench }) => {
	await cases(bench, 'empty/iterate')
		.add('native []', () => sum([]))
		.add('from([])', () => sum(from<number>([])))
		.add('chain', () => sum(empty<number>()))
		.add('Functions', () => sum(Functions.empty<number>()))
		.run();
});
