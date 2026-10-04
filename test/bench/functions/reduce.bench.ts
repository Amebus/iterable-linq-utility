import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, group, records, scenarios } = Helpers;

scenarios('reduce', {
	native: values => values.reduce((acc, v) => acc + v, 0),
	chain: chain => chain.reduce(0, (acc, v) => acc + v),
	Functions: values => Functions.reduce(values, 0, (acc, v) => acc + v)
});

group('reduce', 'no-seed', {
	native: values => values.reduce((acc, v) => acc + v),
	chain: chain => chain.reduce((acc, v) => acc + v),
	Functions: values => Functions.reduce(values, (acc, v) => acc + v)
});

function countByGroup(acc: Record<string, number>, r: Helpers.IRecord): Record<string, number> {
	acc[r.group] = (acc[r.group] ?? 0) + 1;
	return acc;
}

test('reduce: builds an object', async ({ bench }) => {
	await cases(bench, 'reduce/object')
		.add('native', () => records.reduce(countByGroup, {}))
		.add('chain', () => from(records).reduce({}, countByGroup))
		.add('Functions', () => Functions.reduce(records, {}, countByGroup))
		.run();
});
