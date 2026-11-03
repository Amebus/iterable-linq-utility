import { describe, expect, test } from 'vitest';
import { type Pattern, numbers, records, referenceSort } from '../_helpers/sortData';

import { orderOf, PartialSort } from '@/utils';

const patterns: Pattern[] = ['random', 'sorted', 'reversed', 'fewDistinct', 'clustered', 'sampleSorted', 'sampleDescending', 'descentsAt'];
const seeds = [1, 2, 3, 4, 5];

describe('PartialSort', () => {
	describe('sampleSize', () => {
		test.each([[0, 0], [255, 7], [256, 8], [8191, 255], [8192, 256], [100000, 256]])('%i values → %i pairs', (n, sample) => {
			expect(PartialSort.sampleSize(n)).toBe(sample);
		});
	});

	describe('choosePath', () => {
		const sample = (n: number) => PartialSort.sampleSize(n);

		test.each([
			[1024, 255, 'select'],
			[1024, 256, 'select'],
			[1024, 257, 'full'],
			[1023, 255, 'select'],
			[1023, 256, 'full'],
			[256, 1, 'select'],
		] as const)('random data: n = %i, m = %i → %s', (n, m, path) => {
			expect(PartialSort.choosePath(n, m, sample(n))).toBe(path);
		});

		test.each([1, 10, 63, 64])('fewer than 8 pairs in the sample (n = 255): m = %i → full', m => {
			expect(PartialSort.choosePath(255, m, sample(255))).toBe('full');
		});

		test('no descent → full', () => {
			expect(PartialSort.choosePath(1024, 1, 0)).toBe('full');
		});

		test.each([
			[3, 10, 'select'],
			[3, 11, 'full'],
			[4, 11, 'select'],
		] as const)('few descents (n = 1000, 31 pairs): %i descents, m = %i → %s', (descents, m, path) => {
			expect(PartialSort.choosePath(1000, m, descents)).toBe(path);
		});
	});

	describe('countSampleDescents', () => {
		const n = 1024;
		const count = (values: number[]) => PartialSort.countSampleDescents(n, orderOf(values, undefined, false));

		test.each(seeds)('seed %i', seed => {
			expect(count(numbers('sampleSorted', n, seed))).toBe(0);
			expect(count(numbers('sampleDescending', n, seed))).toBe(PartialSort.sampleSize(n));
			for (const k of [1, 3, 10])
				expect(count(numbers('descentsAt', n, seed, k))).toBe(k);
		});

		test('an empty sample has no descent', () => {
			expect(PartialSort.countSampleDescents(31, () => 1)).toBe(0);
		});
	});

	describe('selectWindow', () => {
		const windows = (n: number): [number, number][] => [[0, 1], [0, 10], [0, n >> 2], [(n >> 2) - 1, (n >> 2) + 1], [20, 30], [n - 1, n]];

		describe.each(patterns)('%s', pattern => {
			test.each([256, 1000, 1024])('n = %i', n => {
				const values = numbers(pattern, n, 3, 4);
				const rows = records(values, 3, 5);
				const ids = (indices: number[]) => indices.map(i => rows[i]?.id ?? null);
				for (const descending of [false, true]) {
					const sorted = referenceSort(values, undefined, descending);
					const sortedRows = referenceSort(rows, ['g', 'v'], descending).map(row => row?.id ?? null);
					const byValue = orderOf(values, undefined, descending);
					const byKeys = orderOf(rows, ['g', 'v'], descending);
					for (const [start, end] of windows(n)) {
						expect(PartialSort.selectWindow(n, byValue, start, end).map(i => values[i])).toEqual(sorted.slice(start, end));
						expect(ids(PartialSort.selectWindow(n, byKeys, start, end))).toEqual(sortedRows.slice(start, end));
					}
				}
			});
		});
	});
});
