import { describe, expect, test } from 'vitest';
import { type IRow, type Pattern, numbers, records, referenceSort } from '../_helpers/sortData';

import { collectToArray, sort } from '@/functions';

const sizes = [0, 1, 2, 255, 256, 257, 1000, 1024];
const patterns: Pattern[] = ['random', 'sorted', 'reversed', 'fewDistinct', 'clustered', 'sampleSorted', 'sampleDescending', 'descentsAt'];
const seeds = [1, 2, 3];
const ids = (rows: (IRow | null)[]) => rows.map(row => row?.id ?? null);

describe('sort against the reference', () => {
	describe.each(patterns)('%s', pattern => {
		test.each(sizes)('n = %i', n => {
			for (const seed of seeds) {
				const values = numbers(pattern, n, seed, 4);
				const missing = records(values, seed, 5);
				const complete = records(values, seed);
				for (const descending of [false, true]) {
					const options = { descending };
					expect(collectToArray(sort(values, options))).toEqual(referenceSort(values, undefined, descending));
					expect(ids(collectToArray(sort(missing, 'v', options)))).toEqual(ids(referenceSort(missing, 'v', descending)));
					expect(ids(collectToArray(sort(missing, ['g', 'v'], options)))).toEqual(ids(referenceSort(missing, ['g', 'v'], descending)));
				}
				expect(collectToArray(sort(values))).toEqual(referenceSort(values, undefined, false));
				const compare = (x: IRow, y: IRow) => x.v! - y.v!;
				expect(ids(collectToArray(sort(complete, compare)))).toEqual(ids(referenceSort(complete, compare, false)));
			}
		});
	});
});
