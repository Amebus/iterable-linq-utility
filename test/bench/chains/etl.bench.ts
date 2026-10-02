import { test } from 'vitest';
import * as Helpers from '../helpers';
import type { IRecord } from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, records } = Helpers;

const { filter, flatMap, map, reduce } = Functions;

function countTag(acc: Record<string, number>, tag: string): Record<string, number> {
	acc[tag] = (acc[tag] ?? 0) + 1;
	return acc;
}

const isHigh = (r: IRecord): boolean => r.score >= 500;

// records → filter → map → flatMap(tags) → reduce into a count per tag
test('etl: count tags of high scores', async ({ bench }) => {
	await cases(bench, 'chains/etl')
		.add('native array', () => records
			.filter(isHigh)
			.map(r => r.tags)
			.flatMap(tags => tags)
			.reduce(countTag, {}))
		.add('native loop', () => {
			const acc: Record<string, number> = {};
			for (const r of records) {
				if (isHigh(r)) {
					for (const tag of r.tags) {
						countTag(acc, tag);
					}
				}
			}
			return acc;
		})
		.add('chain', () => from(records)
			.filter(isHigh)
			.map(r => r.tags)
			.flatMap(tags => tags)
			.reduce({}, countTag))
		.add('Functions', () => reduce(flatMap(map(filter(records, isHigh), r => r.tags), tags => tags), {}, countTag))
		.run();
});
