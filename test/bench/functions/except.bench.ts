import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, N, numbers, records, scenarios, sum } = Helpers;

// half of `other` is in `numbers`
const other = numbers.map(value => value + N / 2);

function exceptLoop(values: number[], second: number[]): number {
	const keys = new Set(second);
	let total = 0;
	for (const value of values)
		if (!keys.has(value)) {
			keys.add(value);
			total += value;
		}
	return total;
}

scenarios('except', {
	native: values => sum(new Set(values).difference(new Set(other))),
	loop: values => exceptLoop(values, other),
	chain: chain => sum(chain.except(other)),
	Functions: values => sum(Functions.except(values, other))
});

// every other group is in `otherRecords`
const otherRecords = records.filter(record => record.id % 2 === 0);

test('except: key', async ({ bench }) => {
	await cases(bench, 'except/key')
		.add('native', () => {
			const keys = new Set(otherRecords.map(record => record.group));
			let total = 0;
			for (const record of records)
				if (!keys.has(record.group)) {
					keys.add(record.group);
					total += record.score;
				}
			return total;
		})
		.add('chain', () => sum(from(records).except(otherRecords, record => record.group).map(record => record.score)))
		.add('Functions', () => sum(Functions.map(Functions.except(records, otherRecords, record => record.group), record => record.score)))
		.run();
});
