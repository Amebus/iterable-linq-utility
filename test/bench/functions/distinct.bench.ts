import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers, records, scenarios, sum } = Helpers;

scenarios('distinct', {
	native: values => sum(new Set(values)),
	chain: chain => sum(chain.distinct()),
	Functions: values => sum(Functions.distinct(values))
});

const repeated = numbers.map(value => value % 100);

test('distinct: repeated values', async ({ bench }) => {
	await cases(bench, 'distinct/repeated')
		.add('native', () => sum(new Set(repeated)))
		.add('chain', () => sum(from(repeated).distinct()))
		.add('Functions', () => sum(Functions.distinct(repeated)))
		.run();
});

test('distinct: key', async ({ bench }) => {
	await cases(bench, 'distinct/key')
		.add('native', () => {
			const seen = new Set<string>();
			let result = 0;
			for (const value of records) {
				if (!seen.has(value.group)) {
					seen.add(value.group);
					result += value.score;
				}
			}
			return result;
		})
		.add('chain', () => sum(from(records).distinct(value => value.group).map(value => value.score)))
		.add('Functions', () => sum(Functions.map(Functions.distinct(records, value => value.group), value => value.score)))
		.run();
});

test('distinct: early exit', async ({ bench }) => {
	await cases(bench, 'distinct/early-exit')
		.add('native', () => {
			const seen = new Set<number>();
			let result = 0;
			for (const value of numbers) {
				if (!seen.has(value)) {
					seen.add(value);
					result += value;
					if (seen.size === 100)
						break;
				}
			}
			return result;
		})
		.add('chain', () => sum(from(numbers).distinct().take(100)))
		.add('Functions', () => sum(Functions.take(Functions.distinct(numbers), 100)))
		.run();
});
