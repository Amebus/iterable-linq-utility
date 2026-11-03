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
			[1, 4, 'select'],
			[0, 4, 'full'],
			[1, 3, 'select'],
		] as const)('few descents at an integer boundary (n = 320, 10 pairs): %i descents, m = %i → %s', (descents, m, path) => {
			expect(PartialSort.choosePath(320, m, descents)).toBe(path);
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
		/** An order on random numbers through a compare function, counting its calls. */
		function counted(n: number, compare: (a: number, b: number) => number) {
			const order = orderOf(numbers('random', n, 1), compare, false);
			const counter = { calls: 0, order: (i: number, j: number) => (counter.calls++, order(i, j)) };
			return counter;
		}

		describe.each([
			['(a, b) => a < b ? -1 : 1', (a: number, b: number) => a < b ? -1 : 1],
			['() => -1', () => -1],
			['() => 1', () => 1],
		])('an inconsistent compare function %s', (_, compare) => {
			test.each([[0, 10], [0, 256]])('ends, with distinct indices in range or giving up: [%i, %i)', (start, end) => {
				const n = 1024;
				const counter = counted(n, compare);
				const window = PartialSort.selectWindow(n, counter.order, start, end);
				expect(counter.calls).toBeLessThan(20 * n * Math.log2(n));
				if (window !== undefined) {
					expect(window).toHaveLength(end - start);
					expect(new Set(window).size).toBe(end - start);
					expect(window.every(i => Number.isInteger(i) && i >= 0 && i < n)).toBe(true);
				}
			});
		});

		test('a compare function that is not 0 only on equal values stays within the budget on distinct values', () => {
			const n = 1024;
			const values = Array.from({ length: n }, (_, i) => (i * 389) % n);
			const order = orderOf(values, (a, b) => a < b ? -1 : 1, false);
			expect(PartialSort.selectWindow(n, order, 0, 10)!.map(i => values[i])).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
		});

		test.each([['() => -1', () => -1], ['() => 1', () => 1]])('gives up past the budget, within a bounded work, for %s', (_, compare) => {
			const n = 4096;
			const counter = counted(n, compare);
			expect(PartialSort.selectWindow(n, counter.order, 0, 256)).toBeUndefined();
			expect(counter.calls).toBeLessThanOrEqual(2 * PartialSort.selectBudget(n) + n);
		});

		describe.each(patterns)('the budget is not reached by a consistent order: %s', pattern => {
			test.each([1024, 4096])('n = %i', n => {
				const values = numbers(pattern, n, 2, 4);
				const rows = records(values, 2, 5);
				for (const order of [orderOf(values, undefined, false), orderOf(values, undefined, true), orderOf(rows, ['g', 'v'], false)])
					for (const end of [1, 10, 100, n >> 3, n >> 2])
						expect(PartialSort.selectWindow(n, order, 0, end)).toHaveLength(end);
			});
		});

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
						expect(PartialSort.selectWindow(n, byValue, start, end)!.map(i => values[i])).toEqual(sorted.slice(start, end));
						expect(ids(PartialSort.selectWindow(n, byKeys, start, end)!)).toEqual(sortedRows.slice(start, end));
					}
				}
			});
		});
	});
});
