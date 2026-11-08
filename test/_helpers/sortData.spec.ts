import { describe, expect, test } from 'vitest';

import { longSamplePositions, numbers, prng, records, referenceSort, samplePositions } from './sortData';

const descentsOf = (values: number[], positions: number[]) => positions.filter(i => values[i] > values[i + 1]).length;
const allDescents = (values: number[]) => values.slice(1).filter((v, i) => values[i] > v).length;

describe('sortData', () => {
	test('prng gives the same values for the same seed, in [0, 1)', () => {
		const first = [prng(1), prng(1)].map(random => [random(), random(), random()]);
		expect(first[0]).toEqual(first[1]);
		expect(first[0].every(v => v >= 0 && v < 1)).toBe(true);
		expect(new Set(first[0]).size).toBe(3);
	});

	test('samplePositions', () => {
		expect(samplePositions(31)).toEqual([]);
		expect(samplePositions(64)).toHaveLength(2);
		expect(samplePositions(1024)).toHaveLength(32);
		expect(samplePositions(100_000)).toHaveLength(256);
		for (const n of [64, 1000, 1024, 100_000]) {
			const positions = samplePositions(n);
			const stride = Math.floor((n - 1) / positions.length);
			// one position in each stride, and its pair in the values
			expect(positions.every((i, p) => i >= p * stride && i < (p + 1) * stride)).toBe(true);
			expect(positions.at(-1)! + 1).toBeLessThan(n);
			expect(samplePositions(n)).toEqual(positions);
		}
		// not at a fixed phase of the stride
		expect(new Set(samplePositions(100_000).map(i => i % 10)).size).toBeGreaterThan(5);
	});

	test('longSamplePositions', () => {
		expect(longSamplePositions(32)).toEqual([]);
		expect(longSamplePositions(33)).toEqual([0]);
		for (const n of [256, 1000, 1024, 100_000]) {
			const positions = longSamplePositions(n);
			expect(positions).toHaveLength(Math.min(256, n >> 5));
			const stride = Math.floor((n - 32) / positions.length);
			// one position in each stride, and the pair at distance 32 in the values
			expect(positions.every((i, p) => i >= p * stride && i < (p + 1) * stride)).toBe(true);
			expect(positions.at(-1)!).toBeLessThanOrEqual(n - 33);
			expect(longSamplePositions(n)).toEqual(positions);
		}
		// not the positions of the first sample
		expect(longSamplePositions(100_000)).not.toEqual(samplePositions(100_000));
	});

	test('sorted is ascending', () => {
		const values = numbers('sorted', 100, 1);
		expect(values).toEqual([...values].sort((a, b) => a - b));
	});

	test('sampleSorted: every sampled pair ascends, the rest does not', () => {
		const values = numbers('sampleSorted', 1024, 1);
		const positions = samplePositions(1024);
		expect(descentsOf(values, positions)).toBe(0);
		expect(allDescents(values)).toBeGreaterThanOrEqual(0.3 * 1023);
	});

	test('sampleDescending: every sampled pair descends, and almost nothing else', () => {
		const values = numbers('sampleDescending', 1024, 1);
		const positions = samplePositions(1024);
		expect(descentsOf(values, positions)).toBe(positions.length);
		expect(allDescents(values)).toBeLessThanOrEqual(positions.length);
	});

	test('descentsAt: exactly the requested sampled descents', () => {
		const values = numbers('descentsAt', 1024, 1, 3);
		expect(descentsOf(values, samplePositions(1024))).toBe(3);
		expect(allDescents(values)).toBe(3);
	});

	test('clustered: ceil(n / 64) runs, with repeated values', () => {
		for (const n of [1, 64, 65, 1000]) {
			const values = numbers('clustered', n, 1);
			expect(allDescents(values) + 1).toBe(Math.ceil(n / 64));
		}
		const values = numbers('clustered', 1000, 1);
		expect(new Set(values).size).toBeLessThan(values.length);
	});

	test('organPipe: ascending to the middle, then descending', () => {
		expect(numbers('organPipe', 7, 1)).toEqual([0, 1, 2, 3, 2, 1, 0]);
		expect(numbers('organPipe', 6, 1)).toEqual([0, 1, 2, 2, 1, 0]);
		const values = numbers('organPipe', 1000, 1);
		expect(allDescents(values)).toBe(499);
	});

	test('sawtooth: ascending ramps of length ceil(sqrt(n))', () => {
		expect(numbers('sawtooth', 10, 1)).toEqual([0, 1, 2, 3, 0, 1, 2, 3, 0, 1]);
		const values = numbers('sawtooth', 1000, 1);
		expect(allDescents(values) + 1).toBe(Math.ceil(1000 / 32));
	});

	test('reversedRuns: ascending runs of distinct values, the runs in descending order', () => {
		expect(numbers('reversedRuns', 8, 1, 4)).toEqual([4, 5, 6, 7, 0, 1, 2, 3]);
		expect(numbers('reversedRuns', 7, 1, 3)).toEqual([6, 7, 8, 3, 4, 5, 0]);
		expect(numbers('reversedRuns', 5, 1, 10)).toEqual([0, 1, 2, 3, 4]);
		const values = numbers('reversedRuns', 1000, 1);
		expect(allDescents(values) + 1).toBe(Math.ceil(1000 / 64));
		expect(new Set(values).size).toBe(1000);
	});

	test.each([8, 12])('ascendingRuns: runs of %i ascending by 1, each starting at a seeded level', k => {
		const values = numbers('ascendingRuns', 1000, 1, k);
		expect(values).toHaveLength(1000);
		for (let i = 0; i + 1 < values.length; i++)
			if ((i + 1) % k !== 0)
				expect(values[i + 1]).toBe(values[i] + 1);
		expect(values.every(v => v >= 0 && v < 1_000_000 + k)).toBe(true);
		expect(numbers('ascendingRuns', 1000, 1, k)).toEqual(values);
		expect(numbers('ascendingRuns', 1000, 2, k)).not.toEqual(values);
	});

	test('ascendingRuns: runs of 16 when k is not positive', () => {
		expect(numbers('ascendingRuns', 100, 1)).toEqual(numbers('ascendingRuns', 100, 1, 16));
	});

	test.each([8, 12])('descendingRuns: the runs of ascendingRuns, each one reversed (k = %i)', k => {
		const ascending = numbers('ascendingRuns', 1000, 3, k);
		const values = numbers('descendingRuns', 1000, 3, k);
		for (let start = 0; start < values.length; start += k) {
			const run = values.slice(start, start + k);
			for (let i = 0; i + 1 < run.length; i++)
				expect(run[i + 1]).toBe(run[i] - 1);
			expect(run.toReversed()).toEqual(ascending.slice(start, start + k));
		}
	});

	test('reversed, fewDistinct and random', () => {
		expect(numbers('reversed', 4, 1)).toEqual([3, 2, 1, 0]);
		expect(new Set(numbers('fewDistinct', 100, 1)).size).toBeLessThanOrEqual(5);
		expect(numbers('random', 10, 1)).toEqual(numbers('random', 10, 1));
		expect(numbers('random', 10, 1)).not.toEqual(numbers('random', 10, 2));
	});

	test('records', () => {
		expect(records([10, 11], 1)).toEqual([{ id: 0, g: 3, v: 10 }, { id: 1, g: 4, v: 11 }]);
		const rows = records(Array.from({ length: 20 }, (_, i) => i), 1, 2);
		expect(rows[6]).toBeNull();
		expect(rows[1]).toEqual({ id: 1, v: 1 });
		expect(rows[2]).toEqual({ id: 2, g: 2 });
		expect(rows[5]).toEqual({ id: 5 });
		expect(rows[0]).toEqual({ id: 0, g: 0, v: 0 });
	});

	describe('referenceSort', () => {
		test('the default comparison: missing values go last in source order', () => {
			const nan = Number.NaN;
			expect(referenceSort([3, undefined, 1, null, nan, 2], undefined, false)).toEqual([1, 2, 3, undefined, null, nan]);
			expect(referenceSort([3, undefined, 1, null, nan, 2], undefined, true)).toEqual([3, 2, 1, undefined, null, nan]);
		});

		test('ties keep the order of the source', () => {
			const a = new Date(1);
			const b = new Date(1);
			expect(referenceSort([b, a], undefined, false)).toEqual([b, a]);
			expect(referenceSort([b, a], undefined, true)[0]).toBe(b);
		});

		test('a key: a null element and a missing key go last', () => {
			const items = [{ id: 'a', k: 2 }, { id: 'b' }, null, { id: 'c', k: 1 }, { id: 'd', k: null }];
			expect(referenceSort(items, 'k', false).map(i => i?.id ?? null)).toEqual(['c', 'a', 'b', null, 'd']);
			expect(referenceSort(items, 'k', true).map(i => i?.id ?? null)).toEqual(['a', 'c', 'b', null, 'd']);
		});

		test('a list of keys: the rule applies at each level', () => {
			const items = [{ id: 'a', x: 1, y: 2 }, { id: 'b', x: 1 }, { id: 'c', x: 0, y: 5 }, { id: 'd', x: 1, y: 1 }, { id: 'e', y: 0 }];
			expect(referenceSort(items, ['x', 'y'], false).map(i => i.id)).toEqual(['c', 'd', 'a', 'b', 'e']);
			expect(referenceSort(items, ['x', 'y'], true).map(i => i.id)).toEqual(['a', 'd', 'b', 'c', 'e']);
		});

		test('a compare function decides alone; undefined goes last without a call', () => {
			const calls: unknown[] = [];
			const result = referenceSort<number | undefined>([2, undefined, 3, 1], (a, b) => {
				calls.push(a, b);
				return b! - a!;
			}, false);
			expect(result).toEqual([3, 2, 1, undefined]);
			expect(calls).not.toContain(undefined);
			expect(referenceSort([1, null, 0] as any[], (a, b) => (a ?? 5) - (b ?? 5), false)).toEqual([0, 1, null]);
		});
	});
});
