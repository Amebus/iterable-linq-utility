import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, records, scenarios } = Helpers;

// 100 groups
const keyOf = (value: number): number => value % 100;

// reads every group, so the lazy variants build them all
function sizes(groups: Iterable<[unknown, unknown[]]>): number {
	let total = 0;
	for (const [, values] of groups)
		total += values.length;
	return total;
}

function groupByLoop<T, K>(values: T[], key: (value: T) => K): Map<K, T[]> {
	const groups = new Map<K, T[]>();
	for (const value of values) {
		const k = key(value);
		const group = groups.get(k);
		if (group === undefined)
			groups.set(k, [value]);
		else
			group.push(value);
	}
	return groups;
}

scenarios('groupBy', {
	native: values => sizes(Map.groupBy(values, keyOf)),
	loop: values => sizes(groupByLoop(values, keyOf)),
	chain: chain => sizes(chain.groupBy(keyOf)),
	Functions: values => sizes(Functions.groupBy(values, keyOf))
});

test('groupBy: key', async ({ bench }) => {
	await cases(bench, 'groupBy/key')
		.add('native', () => sizes(Map.groupBy(records, record => record.group)))
		.add('loop', () => sizes(groupByLoop(records, record => record.group)))
		.add('chain', () => sizes(from(records).groupBy(record => record.group)))
		.add('Functions', () => sizes(Functions.groupBy(records, record => record.group)))
		.run();
});
