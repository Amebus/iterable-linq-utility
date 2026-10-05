import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers, records, scenarios, sum } = Helpers;

// 1,000 keys with 10 inner values each
const inner = numbers.slice(0, 10_000);
const keyOf = (value: number): number => value % 1_000;
const count = (_: unknown, inners: unknown[]): number => inners.length;

function groupJoinLoop<T, I, K>(values: T[], others: I[], outerKey: (value: T) => K, innerKey: (value: I) => K): number {
	const groups = new Map<K, I[]>();
	for (const value of others) {
		const key = innerKey(value);
		const group = groups.get(key);
		if (group === undefined)
			groups.set(key, [value]);
		else
			group.push(value);
	}
	let total = 0;
	for (const value of values)
		total += (groups.get(outerKey(value))?.slice() ?? []).length;
	return total;
}

scenarios('groupJoin', {
	native: values => {
		const groups = Map.groupBy(inner, keyOf);
		return sum(values.map(value => count(value, groups.get(keyOf(value))?.slice() ?? [])));
	},
	loop: values => groupJoinLoop(values, inner, keyOf, keyOf),
	chain: chain => sum(chain.groupJoin(inner, keyOf, keyOf, count)),
	Functions: values => sum(Functions.groupJoin(values, inner, keyOf, keyOf, count))
});

// 10 groups, each outer value matches one tenth of the inner values
const groupNames = Array.from({ length: 10 }, (_, i) => `g${i}`);
const innerRecords = records.slice(0, 1_000);

test('groupJoin: key', async ({ bench }) => {
	await cases(bench, 'groupJoin/key')
		.add('loop', () => groupJoinLoop(groupNames, innerRecords, name => name, record => record.group))
		.add('chain', () => sum(from(groupNames).groupJoin(innerRecords, name => name, record => record.group, count)))
		.add('Functions', () => sum(Functions.groupJoin(groupNames, innerRecords, name => name, record => record.group, count)))
		.run();
});
