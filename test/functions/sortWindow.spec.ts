import { afterEach, describe, expect, test, vi } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectTransformation } from '../_helpers/operationKind';
import { type IRow, numbers, records, referenceSort } from '../_helpers/sortData';

import {
	collectToArray,
	range,
	skip,
	slice,
	sort,
	take
} from '@/functions';
import { PartialSort } from '@/utils';
import { returnClosesTheIterator } from './functionsTestUtility';

const values = [5, 3, 8, 1, 9, 2, 7];
const sorted = [1, 2, 3, 5, 7, 8, 9];
const ids = (rows: (IRow | null)[]) => rows.map(row => row?.id ?? null);

afterEach(() => {
	vi.restoreAllMocks();
});

describe('take, skip and slice after sort', () => {

	describe('the recognised forms', () => {
		test.each([
			{ form: 'take(S, 3)', run: (s: Iterable<number>) => take(s, 3), expected: [1, 2, 3] },
			{ form: 'slice(S, 2, 5)', run: (s: Iterable<number>) => slice(s, 2, 5), expected: [3, 5, 7] },
			{ form: 'slice(S, undefined, 2)', run: (s: Iterable<number>) => slice(s, undefined, 2), expected: [1, 2] },
			{ form: 'take(skip(S, 2), 3)', run: (s: Iterable<number>) => take(skip(s, 2), 3), expected: [3, 5, 7] },
			{ form: 'slice(skip(S, 1), 1, 3)', run: (s: Iterable<number>) => slice(skip(s, 1), 1, 3), expected: [3, 5] },
			{ form: 'take(slice(S, 2), 2)', run: (s: Iterable<number>) => take(slice(s, 2), 2), expected: [3, 5] },
			{ form: 'skip(S, 2)', run: (s: Iterable<number>) => skip(s, 2), expected: [3, 5, 7, 8, 9] },
			{ form: 'slice(S, 2)', run: (s: Iterable<number>) => slice(s, 2), expected: [3, 5, 7, 8, 9] },
			{ form: 'slice(S)', run: (s: Iterable<number>) => slice(s), expected: sorted },
			{ form: 'skip(skip(S, 2), 3)', run: (s: Iterable<number>) => skip(skip(s, 2), 3), expected: [8, 9] },
			{ form: 'take(skip(skip(S, 1), 1), 2)', run: (s: Iterable<number>) => take(skip(skip(s, 1), 1), 2), expected: [3, 5] },
			{ form: 'take(skip(slice(S, 1), 2), 2)', run: (s: Iterable<number>) => take(skip(slice(s, 1), 2), 2), expected: [5, 7] },
			{ form: 'skip(S, 0)', run: (s: Iterable<number>) => skip(s, 0), expected: sorted }
		])('$form', ({ run, expected }) => {
			expect(collectToArray(run(sort(values)))).toEqual(expected);
		});

		test.each([
			{ form: 'take(S, 0)', run: (s: Iterable<number>) => take(s, 0) },
			{ form: 'take(skip(S, 2), 0)', run: (s: Iterable<number>) => take(skip(s, 2), 0) },
			{ form: 'slice(S, 3, 3)', run: (s: Iterable<number>) => slice(s, 3, 3) },
			{ form: 'slice(S, 5, 2)', run: (s: Iterable<number>) => slice(s, 5, 2) },
			{ form: 'slice(skip(S, 1), 4, 1)', run: (s: Iterable<number>) => slice(skip(s, 1), 4, 1) }
		])('an empty window, $form, yields nothing and does not read the source', ({ run }) => {
			const source = spyIterable(values);
			expect(collectToArray(run(sort(source)))).toEqual([]);
			expect(source.stats).toEqual({ iterations: 0, reads: 0 });
		});

		test('an empty window closes the source it does not read', () => {
			const returnSpy = vi.fn(() => ({ done: true as const, value: undefined }));
			const next = vi.fn();
			const source = { [Symbol.iterator]: () => ({ next, return: returnSpy }) };
			expect(collectToArray(take(sort(source), 0))).toEqual([]);
			expect(next).not.toHaveBeenCalled();
			expect(returnSpy).toHaveBeenCalledTimes(1);
		});

		test.each([
			{ form: 'take(S, 100)', run: (s: Iterable<number>) => take(s, 100), expected: sorted },
			{ form: 'take(skip(S, 5), 100)', run: (s: Iterable<number>) => take(skip(s, 5), 100), expected: [8, 9] },
			{ form: 'take(skip(S, 7), 3)', run: (s: Iterable<number>) => take(skip(s, 7), 3), expected: [] },
			{ form: 'take(skip(S, 10), 3)', run: (s: Iterable<number>) => take(skip(s, 10), 3), expected: [] },
			{ form: 'slice(S, 5, 100)', run: (s: Iterable<number>) => slice(s, 5, 100), expected: [8, 9] },
			{ form: 'slice(S, 9, 12)', run: (s: Iterable<number>) => slice(s, 9, 12), expected: [] },
			{ form: 'skip(S, 7)', run: (s: Iterable<number>) => skip(s, 7), expected: [] },
			{ form: 'skip(S, 20)', run: (s: Iterable<number>) => skip(s, 20), expected: [] }
		])('past the end: $form', ({ run, expected }) => {
			expect(collectToArray(run(sort(values)))).toEqual(expected);
		});

		test.each([
			{ form: 'slice(S, -2)', run: (s: Iterable<number>) => slice(s, -2), expected: [8, 9] },
			{ form: 'slice(S, 1, -1)', run: (s: Iterable<number>) => slice(s, 1, -1), expected: [2, 3, 5, 7, 8] },
			{ form: 'slice(S, -4, 5)', run: (s: Iterable<number>) => slice(s, -4, 5), expected: [5, 7] },
			{ form: 'slice(skip(S, 2), -2)', run: (s: Iterable<number>) => slice(skip(s, 2), -2), expected: [8, 9] }
		])('a negative index takes the path of today: $form', ({ run, expected }) => {
			expect(collectToArray(run(sort(values)))).toEqual(expected);
		});

		test('the window is not recognised again', () => {
			expect(collectToArray(take(take(sort(values), 5), 2))).toEqual([1, 2]);
			expect(collectToArray(skip(take(sort(values), 5), 2))).toEqual([3, 5, 7]);
			expect(collectToArray(slice(take(sort(values), 5), 1, 3))).toEqual([2, 3]);
		});

		test('every kind of comparer and both directions, with missing values', () => {
			const rows = records(numbers('random', 40, 1), 1, 5);
			const complete = records(numbers('random', 40, 2), 2);
			const compare = (x: IRow, y: IRow) => x.v! - y.v!;
			for (const descending of [false, true]) {
				const options = { descending };
				expect(ids(collectToArray(take(skip(sort(rows, 'v', options), 3), 10)))).toEqual(ids(referenceSort(rows, 'v', descending).slice(3, 13)));
				expect(ids(collectToArray(slice(sort(rows, ['g', 'v'], options), 30, 40)))).toEqual(ids(referenceSort(rows, ['g', 'v'], descending).slice(30, 40)));
				expect(collectToArray(take(sort([2, null, 1, undefined, NaN, 0], options), 5))).toEqual(referenceSort([2, null, 1, undefined, NaN, 0], undefined, descending).slice(0, 5));
			}
			expect(ids(collectToArray(take(sort(complete, compare), 5)))).toEqual(ids(referenceSort(complete, compare, false).slice(0, 5)));
		});

		test('the arguments are validated first, with the messages of the operation', () => {
			const s = sort(values);
			expect(() => take(s, -1)).toThrow(new Error('[iterable-linq-utility/take] The "count" parameter must be a non-negative integer'));
			expect(() => skip(s, 1.5)).toThrow(new Error('[iterable-linq-utility/skip] The "count" parameter must be a non-negative integer'));
			expect(() => slice(s, NaN)).toThrow(new Error('[iterable-linq-utility/slice] The "start" parameter must be an integer'));
			expect(() => slice(s, 0, Infinity)).toThrow(new Error('[iterable-linq-utility/slice] The "end" parameter must be an integer'));
		});
	});

	describe('deferred and re-runnable', () => {
		test('take(sort(s), 3) is transformation', () => {
			expectTransformation(source => take(sort(source), 3));
		});

		test('skip(sort(s), 2) is transformation', () => {
			expectTransformation(source => skip(sort(source), 2));
		});

		test('slice(skip(sort(s), 1), 0, 2) is transformation', () => {
			expectTransformation(source => slice(skip(sort(source), 1), 0, 2));
		});

		test.each([
			{ returnValue: 'a value' },
			{ returnValue: 123 },
			{ returnValue: null },
			{}
		])('take(sort(range(20)), 5)[Symbol.iterator]().return() closes the iterator', ({ returnValue }) => {
			returnClosesTheIterator(take(sort(range(20)), 5), returnValue);
			returnClosesTheIterator(skip(sort(range(20)), 5), returnValue);
		});

		test('two runs read the source twice', () => {
			const source = spyIterable(values);
			const window = take(skip(sort(source), 1), 3);
			expect(collectToArray(window)).toEqual([2, 3, 5]);
			expect(collectToArray(window)).toEqual([2, 3, 5]);
			expect(source.stats).toEqual({ iterations: 2, reads: 14 });
		});

		test('the whole source is read before the first value', () => {
			const source = spyIterable(values);
			const it = take(sort(source), 2)[Symbol.iterator]();
			expect(it.next().value).toBe(1);
			expect(source.stats.reads).toBe(7);
		});

		test('the next run sees a changed source', () => {
			const source = [3, 1, 2];
			const window = take(sort(source), 2);
			expect(collectToArray(window)).toEqual([1, 2]);
			source.push(0);
			expect(collectToArray(window)).toEqual([0, 1]);
		});

		test('an array source is not changed', () => {
			const source = numbers('random', 1024, 1);
			const copy = [...source];
			collectToArray(take(sort(source), 10));
			expect(source).toEqual(copy);
		});
	});

	describe('errors', () => {
		const random = numbers('random', 1024, 1);

		test.each([
			{ name: 'the full sort', source: [2, 1, 3] },
			{ name: 'the sample of the partial sort', source: random }
		])('an error of the compare function, in $name, propagates as the same object, the iterator is done, a new run throws again', ({ source }) => {
			const error = new Error('boom');
			const window = take(sort(source, () => {
				throw error;
			}), 2);
			const it = window[Symbol.iterator]();
			expect(() => it.next()).toThrow(error);
			expect(it.next()).toEqual({ done: true, value: undefined });
			expect(() => collectToArray(window)).toThrow(error);
		});

		test('an error of the compare function in the quickselect propagates', () => {
			const error = new Error('boom');
			let calls = 0;
			const window = take(sort(random, (a, b) => {
				// the sample compares 32 pairs: the quickselect throws
				if (++calls > 40)
					throw error;
				return a - b;
			}), 10);
			const spy = vi.spyOn(PartialSort, 'selectWindow');
			expect(() => collectToArray(window)).toThrow(error);
			expect(spy).toHaveBeenCalled();
		});

		test('an error of a key read propagates as the same object and the iterator is done', () => {
			const error = new Error('getter');
			const rows = random.map((v, i) => i === 500
				? { get v(): number {
					throw error;
				} }
				: { v });
			const it = take(sort(rows, 'v'), 5)[Symbol.iterator]();
			expect(() => it.next()).toThrow(error);
			expect(it.next()).toEqual({ done: true, value: undefined });
		});

		describe('in the second sample', () => {
			const n = 1024;
			const pairs = PartialSort.sampleSize(n);
			const inOrder = numbers('sorted', n, 1);

			test('an error of the compare function propagates as the same object, closes the source, the iterator is done, a new run throws again', () => {
				const error = new Error('boom');
				const { state, iterable } = closableSource(inOrder);
				let calls = 0;
				const window = take(sort(iterable, (a, b) => {
					// the first sample compares its pairs: only the first call after them throws, so nothing but the second sample can throw
					if (++calls === pairs + 1)
						throw error;
					return a - b;
				}), 10);
				const second = vi.spyOn(PartialSort, 'countLongSampleDescents');
				const select = vi.spyOn(PartialSort, 'selectWindow');
				const it = window[Symbol.iterator]();
				expect(() => it.next()).toThrow(error);
				expect(second).toHaveBeenCalledTimes(1);
				expect(select).not.toHaveBeenCalled();
				expect(state.closed).toBe(true);
				expect(it.next()).toEqual({ done: true, value: undefined });
				calls = 0;
				expect(() => collectToArray(window)).toThrow(error);
			});

			test('an error of a key read propagates as the same object, closes the source and the iterator is done', () => {
				const error = new Error('getter');
				let reads = 0;
				const rows = inOrder.map(value => ({
					get v(): number {
						// the first sample reads the key of both values of each pair: only the first read after them throws
						if (++reads === 2 * pairs + 1)
							throw error;
						return value;
					}
				}));
				const { state, iterable } = closableSource(rows);
				const second = vi.spyOn(PartialSort, 'countLongSampleDescents');
				const it = take(sort(iterable, 'v'), 10)[Symbol.iterator]();
				expect(() => it.next()).toThrow(error);
				expect(second).toHaveBeenCalledTimes(1);
				expect(state.closed).toBe(true);
				expect(it.next()).toEqual({ done: true, value: undefined });
			});
		});

		test('an error of the compare function closes the source', () => {
			const { state, iterable } = closableSource([2, 1, 3]);
			expect(() => collectToArray(take(sort(iterable, () => {
				throw new Error('boom');
			}), 2))).toThrow('boom');
			expect(state.closed).toBe(true);
		});

		test('an error of the source propagates on the first read, without closing it', () => {
			const error = new Error('source');
			const { returnSpy, iterable } = throwingSource(2, error);
			const it = take(skip(sort(iterable), 1), 3)[Symbol.iterator]();
			expect(() => it.next()).toThrow(error);
			expect(returnSpy).not.toHaveBeenCalled();
		});
	});

	describe('the path', () => {
		test.each([
			{ name: 'random data, a window of 10', source: numbers('random', 1024, 1), count: 10, select: true },
			{ name: 'random data, a window of 256 (a quarter)', source: numbers('random', 1024, 1), count: 256, select: true },
			{ name: 'random data, a window of 257', source: numbers('random', 1024, 1), count: 257, select: false },
			{ name: 'random data sorted only where the first sample looks: the second one sees it', source: numbers('sampleSorted', 1024, 1), count: 10, select: true },
			{ name: 'short runs that look sorted', source: numbers('ascendingRuns', 4096, 1, 16), count: 10, select: true },
			{ name: 'short runs that look reversed', source: numbers('descendingRuns', 4096, 1, 16), count: 10, select: true },
			{ name: 'sorted data', source: numbers('sorted', 1024, 1), count: 10, select: false },
			{ name: 'reversed data', source: numbers('reversed', 1024, 1), count: 10, select: false },
			{ name: 'nearly reversed data', source: numbers('sampleDescending', 4096, 1).reverse(), count: 10, select: false },
			{ name: 'ascending runs of 1,000 in descending order', source: numbers('reversedRuns', 4096, 1, 1000), count: 10, select: false },
			{ name: 'fewer than 8 pairs in the sample', source: numbers('random', 255, 1), count: 10, select: false }
		])('$name: the partial sort is used = $select', ({ source, count, select }) => {
			const spy = vi.spyOn(PartialSort, 'selectWindow');
			expect(collectToArray(take(sort(source), count))).toEqual(referenceSort(source, undefined, false).slice(0, count));
			expect(spy).toHaveBeenCalledTimes(select ? 1 : 0);
		});

		test.each([
			{ name: 'by a compare function', run: (s: number[]) => sort(s, (a, b) => b - a) },
			{ name: 'descending', run: (s: number[]) => sort(s, { descending: true }) }
		])('sorted data read in reverse, $name, keeps the full sort', ({ run }) => {
			const source = numbers('sorted', 4096, 1);
			const spy = vi.spyOn(PartialSort, 'selectWindow');
			expect(collectToArray(take(run(source), 10))).toEqual(referenceSort(source, undefined, true).slice(0, 10));
			expect(spy).not.toHaveBeenCalled();
		});

		test('on the path of the full sort, the keys are read no more than by the full sort, plus the pairs of the two samples', () => {
			const n = 100_000;
			let reads = 0;
			const rows = Array.from({ length: n }, (_, i) => ({
				get v() {
					reads++;
					return i;
				}
			}));
			const sorted = sort(rows, 'v');
			collectToArray(sorted);
			const full = reads;
			reads = 0;
			const spy = vi.spyOn(PartialSort, 'selectWindow');
			expect(collectToArray(take(sorted, 10))).toEqual(rows.slice(0, 10));
			expect(spy).not.toHaveBeenCalled();
			expect(reads).toBeLessThanOrEqual(full + 4 * PartialSort.sampleSize(n));
		});

		test('on the path of the full sort with a list of keys, the two samples read both keys of both values of each pair', () => {
			const n = 100_000;
			let reads = 0;
			// the first key ties everywhere, so every comparison reads the second one too
			const rows = Array.from({ length: n }, (_, i) => ({
				get g() {
					reads++;
					return 0;
				},
				get v() {
					reads++;
					return i;
				}
			}));
			const sorted = sort(rows, ['g', 'v']);
			collectToArray(sorted);
			const full = reads;
			reads = 0;
			const spy = vi.spyOn(PartialSort, 'selectWindow');
			expect(collectToArray(take(sorted, 10))).toEqual(rows.slice(0, 10));
			expect(spy).not.toHaveBeenCalled();
			// 2 samples, 2 values for each pair, 2 keys for each value
			expect(reads).toBeLessThanOrEqual(full + 8 * PartialSort.sampleSize(n));
			expect(reads).toBeGreaterThan(full + 4 * PartialSort.sampleSize(n));
		});

		test.each([
			{ name: 'random data: the first sample is enough', source: numbers('random', 4096, 1), calls: 0 },
			{ name: 'sorted data: the first sample asks for the second', source: numbers('sorted', 4096, 1), calls: 1 }
		])('$name', ({ source, calls }) => {
			const spy = vi.spyOn(PartialSort, 'countLongSampleDescents');
			collectToArray(take(sort(source), 10));
			expect(spy).toHaveBeenCalledTimes(calls);
		});

		test('a window past a quarter reads neither sample', () => {
			const first = vi.spyOn(PartialSort, 'countSampleDescents');
			const second = vi.spyOn(PartialSort, 'countLongSampleDescents');
			collectToArray(take(sort(numbers('sorted', 4096, 1)), 2000));
			expect(first).not.toHaveBeenCalled();
			expect(second).not.toHaveBeenCalled();
		});

		test('sort read alone does not use the partial sort', () => {
			const source = numbers('random', 1024, 1);
			const spy = vi.spyOn(PartialSort, 'selectWindow');
			expect(collectToArray(skip(sort(source), 1020))).toEqual(referenceSort(source, undefined, false).slice(1020));
			expect(spy).not.toHaveBeenCalled();
		});

		test('a page of records by a key takes the partial sort', () => {
			const rows = records(numbers('random', 2048, 3), 3, 9);
			const spy = vi.spyOn(PartialSort, 'selectWindow');
			expect(ids(collectToArray(take(skip(sort(rows, 'v', { descending: true }), 20), 10)))).toEqual(ids(referenceSort(rows, 'v', true).slice(20, 30)));
			expect(spy).toHaveBeenCalledTimes(1);
		});

		test('when the partial sort gives up, the full sort yields the window', () => {
			const source = numbers('random', 1024, 2);
			const spy = vi.spyOn(PartialSort, 'selectWindow').mockReturnValue(undefined);
			expect(collectToArray(take(skip(sort(source), 5), 10))).toEqual(referenceSort(source, undefined, false).slice(5, 15));
			expect(spy).toHaveBeenCalledTimes(1);
		});

		test('an inconsistent compare function ends, with values of the source', () => {
			const source = numbers('random', 1024, 3);
			let state = 7;
			const inconsistent = () => {
				state = (state * 1103515245 + 12345) % 2147483648;
				return state % 3 - 1;
			};
			const window = collectToArray(take(sort(source, inconsistent), 100));
			expect(window).toHaveLength(100);
			for (const value of window)
				expect(source).toContain(value);
		});
	});
});
