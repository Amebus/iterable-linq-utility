import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, N, numbers, records, scenarios, sum } = Helpers;

// half of `other` is already in `numbers`
const other = numbers.map(value => value + N / 2);

function unionLoop(values: number[], second: number[]): number {
	const seen = new Set<number>();
	let total = 0;
	for (const source of [values, second])
		for (const value of source)
			if (!seen.has(value)) {
				seen.add(value);
				total += value;
			}
	return total;
}

scenarios('union', {
	native: values => sum(new Set(values).union(new Set(other))),
	loop: values => unionLoop(values, other),
	chain: chain => sum(chain.union(other)),
	Functions: values => sum(Functions.union(values, other))
});

const otherRecords = records.map(record => ({ ...record, group: `${record.group}-other` }));

test('union: key', async ({ bench }) => {
	await cases(bench, 'union/key')
		.add('native', () => {
			const seen = new Set<string>();
			let total = 0;
			for (const source of [records, otherRecords])
				for (const record of source)
					if (!seen.has(record.group)) {
						seen.add(record.group);
						total += record.score;
					}
			return total;
		})
		.add('chain', () => sum(from(records).union(otherRecords, record => record.group).map(record => record.score)))
		.add('Functions', () => sum(Functions.map(Functions.union(records, otherRecords, record => record.group), record => record.score)))
		.run();
});

// `union` is lazy: the first 100 values read 100 values of the source, and never `other`
test('union: early exit', async ({ bench }) => {
	await cases(bench, 'union/early-exit')
		.add('native', () => sum(Array.from(new Set(numbers).union(new Set(other))).slice(0, 100)))
		.add('chain', () => sum(from(numbers).union(other).take(100)))
		.add('Functions', () => sum(Functions.take(Functions.union(numbers, other), 100)))
		.run();
});
