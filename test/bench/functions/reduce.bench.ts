import { test } from 'vitest';
import * as Helpers from '../helpers';
import type { IRecord } from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers, records } = Helpers;

function countByGroup(acc: Record<string, number>, r: IRecord): Record<string, number> {
	acc[r.group] = (acc[r.group] ?? 0) + 1;
	return acc;
}

test('reduce: sum', async ({ bench }) => {
	await cases(bench, 'reduce/sum')
		.add('native', () => numbers.reduce((acc, v) => acc + v, 0))
		.add('chain', () => from(numbers).reduce(0, (acc, v) => acc + v))
		.add('Functions', () => Functions.reduce(numbers, 0, (acc, v) => acc + v))
		.run();
});

test('reduce: builds an object', async ({ bench }) => {
	await cases(bench, 'reduce/object')
		.add('native', () => records.reduce(countByGroup, {}))
		.add('chain', () => from(records).reduce({}, countByGroup))
		.add('Functions', () => Functions.reduce(records, {}, countByGroup))
		.run();
});

test('reduce: without a seed', async ({ bench }) => {
	await cases(bench, 'reduce/no-seed')
		.add('native', () => numbers.reduce((acc, v) => acc + v))
		.add('chain', () => from(numbers).reduce((acc, v) => acc + v))
		.add('Functions', () => Functions.reduce(numbers, (acc, v) => acc + v))
		.run();
});
