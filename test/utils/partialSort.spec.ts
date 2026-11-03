import { describe, expect, test } from 'vitest';
import { numbers, patterns, prng, records, referenceSort, samplePositions } from '../_helpers/sortData';

import { orderOf, PartialSort } from '@/utils';

const seeds = [1, 2, 3, 4, 5];

describe('PartialSort', () => {
	describe('sampleSize', () => {
		test.each([[0, 0], [255, 7], [256, 8], [8191, 255], [8192, 256], [100000, 256]])('%i values → %i pairs', (n, sample) => {
			expect(PartialSort.sampleSize(n)).toBe(sample);
		});
	});

	describe('choosePath', () => {
		const sample = (n: number) => PartialSort.sampleSize(n);
		/** Half the pairs out of order: random data, as far from sorted as from reversed. */
		const half = (n: number) => sample(n) >> 1;

		test.each([
			[1024, 255, 'select'],
			[1024, 256, 'select'],
			[1024, 257, 'full'],
			[1023, 255, 'select'],
			[1023, 256, 'full'],
			[256, 1, 'select'],
			[100_000, 1, 'select'],
			[100_000, 25_000, 'select'],
			[100_000, 25_001, 'full']
		] as const)('random data: n = %i, m = %i → %s', (n, m, path) => {
			expect(PartialSort.choosePath(n, m, half(n))).toBe(path);
		});

		test.each([1, 10, 63, 64])('fewer than 8 pairs in the sample (n = 255): m = %i → full', m => {
			expect(PartialSort.choosePath(255, m, half(255))).toBe('full');
		});

		test.each([1, 10, 256])('no descent, or every pair a descent → full: m = %i', m => {
			expect(PartialSort.choosePath(1024, m, 0)).toBe('full');
			expect(PartialSort.choosePath(1024, m, sample(1024))).toBe('full');
		});

		test.each([1, 80])('at an integer boundary (n = 320, 10 pairs, a tenth is 1): m = %i', m => {
			expect(PartialSort.choosePath(320, m, 0)).toBe('full');
			expect(PartialSort.choosePath(320, m, 1)).toBe('select');
			expect(PartialSort.choosePath(320, m, 9)).toBe('select');
			expect(PartialSort.choosePath(320, m, 10)).toBe('full');
		});

		test.each([[320, 81], [1000, 251]])('past a quarter the full sort, whatever the sample (n = %i, m = %i)', (n, m) => {
			for (let descents = 0; descents <= PartialSort.sampleSize(n); descents++)
				expect(PartialSort.choosePath(n, m, descents)).toBe('full');
		});

		test.each([255, 256, 257, 1000, 1023, 1024, 4096, 100_000])('the size-only check of the window agrees with the rule (n = %i)', n => {
			// the window asks choosePath with half the pairs out of order before reading the sample: it must never answer 'full'
			// when some sample would give 'select'
			const sample = PartialSort.sampleSize(n);
			for (const m of [1, Math.floor(n / 4), Math.floor(n / 4) + 1, n]) {
				const sizes = PartialSort.choosePath(n, m, sample >> 1);
				for (let descents = 0; descents <= sample; descents++) {
					if (PartialSort.choosePath(n, m, descents) === 'select')
						expect(sizes).toBe('select');
				}
				expect(sizes).toBe(m > n / 4 || sample < 8 ? 'full' : 'select');
			}
		});

		test.each([1, 250])('either side of a tenth (n = 1000, 31 pairs, a tenth is 3.1): m = %i', m => {
			expect(PartialSort.choosePath(1000, m, 3)).toBe('full');
			expect(PartialSort.choosePath(1000, m, 4)).toBe('select');
			expect(PartialSort.choosePath(1000, m, 27)).toBe('select');
			expect(PartialSort.choosePath(1000, m, 28)).toBe('full');
		});

		test('a quarter wins over the descents', () => {
			expect(PartialSort.choosePath(1000, 251, 4)).toBe('full');
			expect(PartialSort.choosePath(1000, 251, 27)).toBe('full');
		});

		describe.each([1024, 4096, 100_000])('data sorted in either direction keeps the full sort for every window (n = %i)', n => {
			const ms = [1, 10, 100, Math.floor(n / 100), Math.floor(n / 4)];
			const sources: [string, number[], boolean][] = [
				['reversed', numbers('reversed', n, 1), false],
				['sorted, descending', numbers('sorted', n, 1), true],
				['sample descending, descending', numbers('sampleDescending', n, 1), true],
				...[64, 1000, 1024, 5000].map((run): [string, number[], boolean] => [`ascending runs of ${run} in descending order`, numbers('reversedRuns', n, 1, run), false]),
				...[64, 1000, 1024, 5000].map((run): [string, number[], boolean] => [`descending runs of ${run} in ascending order, descending`, numbers('reversedRuns', n, 1, run).reverse(), true])
			];

			test.each(sources)('%s', (_, values, descending) => {
				for (const order of [orderOf(values, undefined, descending), orderOf(values, descending ? (a: number, b: number) => b - a : (a: number, b: number) => a - b, false)]) {
					const descents = PartialSort.countSampleDescents(n, order);
					for (const m of ms)
						expect(PartialSort.choosePath(n, m, descents)).toBe('full');
				}
			});
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

		test.each([32, 64, 1000, 1024, 4096, 100_000])('reads the pairs at the positions of the test data (n = %i)', n => {
			const read: number[] = [];
			PartialSort.countSampleDescents(n, (i, j) => {
				expect(j).toBe(i + 1);
				read.push(i);
				return -1;
			});
			expect(read).toEqual(samplePositions(n));
		});

		describe.each([4096, 100_000])('periodic data of period 10 (n = %i)', n => {
			test('the sample sees the ends of the periods', () => {
				const values = Array.from({ length: n }, (_, i) => i % 10);
				const random = prng(n);
				const rows = values.map(g => ({ group: `g${g}`, score: Math.floor(random() * 1000) }));
				for (const order of [orderOf(values, undefined, false), orderOf(rows, ['group', 'score'], false)]) {
					const descents = PartialSort.countSampleDescents(n, order);
					// a pair descends exactly when it straddles the end of a period: the count the positions predict, not a range
					const expected = samplePositions(n).filter(i => i % 10 === 9).length;
					expect(descents).toBe(expected);
					expect(descents).toBeGreaterThan(0);
					if (n === 100_000)
						expect(PartialSort.choosePath(n, 10, descents)).toBe('select');
				}
			});
		});

		test('a sawtooth whose ramps end at every position of an evenly spaced sample is seen as nearly sorted', () => {
			const n = 100_000;
			const sample = PartialSort.sampleSize(n);
			const stride = Math.floor((n - 1) / sample);
			// a ramp of `stride` values ends at every p * stride
			const values = Array.from({ length: n }, (_, i) => (i + stride - 1) % stride);
			const order = orderOf(values, undefined, false);
			const evenlySpaced = Array.from({ length: sample }, (_, p) => p * stride).filter(i => order(i, i + 1) > 0).length;
			expect(evenlySpaced).toBe(sample);
			const descents = PartialSort.countSampleDescents(n, order);
			expect(descents).toBeLessThan(sample / 10);
			expect(PartialSort.choosePath(n, 10_000, descents)).toBe('full');
		});

		test('the same input gives the same descents', () => {
			const values = numbers('random', 4096, 9);
			const counts = [0, 1, 2].map(() => PartialSort.countSampleDescents(4096, orderOf(values, undefined, false)));
			expect(new Set(counts).size).toBe(1);
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

		/** The patterns measured at 100,000 values too; all of them at 1024 and 4096. */
		const large = new Set(['random', 'sorted', 'reversed', 'organPipe', 'sawtooth']);

		describe.each(patterns)('the budget is not reached by a consistent order: %s', pattern => {
			test.each([1024, 4096, 100_000].filter(n => n < 100_000 || large.has(pattern)))('n = %i', n => {
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
