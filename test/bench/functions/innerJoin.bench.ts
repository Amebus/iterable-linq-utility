import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers, records, scenarios, sum } = Helpers;

// 1,000 keys with 2 inner values each: every value of the source has 2 matches
const inner = numbers.slice(0, 2_000);
const keyOf = (value: number): number => value % 1_000;
const second = (_: unknown, value: number): number => value;

function innerJoinLoop<T, I, K>(values: T[], others: I[], outerKey: (value: T) => K, innerKey: (value: I) => K, result: (outer: T, inner: I) => number): number {
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
	for (const value of values) {
		const group = groups.get(outerKey(value));
		if (group !== undefined)
			for (const match of group)
				total += result(value, match);
	}
	return total;
}

scenarios('innerJoin', {
	native: values => {
		const groups = Map.groupBy(inner, keyOf);
		return sum(values.flatMap(value => (groups.get(keyOf(value)) ?? []).map(match => second(value, match))));
	},
	loop: values => innerJoinLoop(values, inner, keyOf, keyOf, second),
	chain: chain => sum(chain.innerJoin(inner, keyOf, keyOf, second)),
	Functions: values => sum(Functions.innerJoin(values, inner, keyOf, keyOf, second))
});

// 10 groups, each outer value matches one tenth of the inner values
const groupNames = Array.from({ length: 10 }, (_, i) => `g${i}`);
const innerRecords = records.slice(0, 1_000);
const score = (_: string, record: Helpers.IRecord): number => record.score;

test('innerJoin: key', async ({ bench }) => {
	await cases(bench, 'innerJoin/key')
		.add('loop', () => innerJoinLoop(groupNames, innerRecords, name => name, record => record.group, score))
		.add('chain', () => sum(from(groupNames).innerJoin(innerRecords, name => name, record => record.group, score)))
		.add('Functions', () => sum(Functions.innerJoin(groupNames, innerRecords, name => name, record => record.group, score)))
		.run();
});
