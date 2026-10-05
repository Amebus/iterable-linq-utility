import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, N, numbers, records, scenarios, sum } = Helpers;

// half of `other` is in `numbers`
const other = numbers.map(value => value + N / 2);

function intersectLoop(values: number[], second: number[]): number {
	const keys = new Set(second);
	let total = 0;
	for (const value of values)
		if (keys.delete(value)) {
			total += value;
		}
	return total;
}

scenarios('intersect', {
	native: values => sum(new Set(values).intersection(new Set(other))),
	loop: values => intersectLoop(values, other),
	chain: chain => sum(chain.intersect(other)),
	Functions: values => sum(Functions.intersect(values, other))
});

// every other group is in `otherRecords`
const otherRecords = records.filter(record => record.id % 2 === 0);

test('intersect: key', async ({ bench }) => {
	await cases(bench, 'intersect/key')
		.add('native', () => {
			const keys = new Set(otherRecords.map(record => record.group));
			let total = 0;
			for (const record of records)
				if (keys.delete(record.group)) {
					total += record.score;
				}
			return total;
		})
		.add('chain', () => sum(from(records).intersect(otherRecords, record => record.group).map(record => record.score)))
		.add('Functions', () => sum(Functions.map(Functions.intersect(records, otherRecords, record => record.group), record => record.score)))
		.run();
});
