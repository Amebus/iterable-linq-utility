import { describe, expect, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectTransformation } from '../_helpers/operationKind';

import {
	collectToArray,
	range,
	slice,
	take
} from '@/functions';
import { returnClosesTheIterator, withoutInputIterableThrowsException } from './functionsTestUtility';

const indexes = [undefined, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8];

describe('slice', () => {

	test('slice without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(slice);
	});

	test.each([2.5, NaN, Infinity, -Infinity, null, '2'])('slice(range(10), %s) -> throw exception', start => {
		expect(() => slice(range(10), start as any)).toThrow(new Error('[iterable-linq-utility/slice] The "start" parameter must be an integer'));
	});

	test.each([2.5, NaN, Infinity, -Infinity, null, '2'])('slice(range(10), 0, %s) -> throw exception', end => {
		expect(() => slice(range(10), 0, end as any)).toThrow(new Error('[iterable-linq-utility/slice] The "end" parameter must be an integer'));
	});

	test.each([
		{ start: 2, end: 8 },
		{ start: 2, end: -2 },
		{ start: -6, end: 8 },
		{ start: -6, end: -2 },
		{ start: -6, end: undefined }
	])('slice(range(10), $start, $end)[Symbol.iterator]().return() closes the iterator', ({ start, end }) => {
		returnClosesTheIterator(slice(range(10), start, end), 'a value');
	});

	test.each([0, 1, 2, 3, 4, 5, 6])('slice yields the values of Array.prototype.slice on %i values, for every start and end', length => {
		const values = Array.from({ length }, (_, i) => i * 10);
		for (const start of indexes) {
			for (const end of indexes)
				expect(collectToArray(slice(values, start, end)), `slice(${length} values, ${start}, ${end})`).toEqual(values.slice(start, end));
		}
	});

	test('slice(iterable) yields all the values', () => {
		expect(collectToArray(slice([1, 2, 3]))).toEqual([1, 2, 3]);
	});

	test.each([
		{ start: 1, end: 3 },
		{ start: 1, end: -1 },
		{ start: -2, end: undefined },
		{ start: -3, end: 2 }
	])('slice(iterable, $start, $end) is transformation', ({ start, end }) => {
		expectTransformation(source => slice(source, start, end));
	});

	test('slice allows re-run', () => {
		for (const [start, end] of [[1, 3], [1, -1], [-2, undefined], [-3, -1]]) {
			const sliced = slice(range(5), start, end);
			expect(collectToArray(sliced)).toEqual(collectToArray(sliced));
		}
	});

	test('slice with a non-negative end reads the source up to end, then closes it', () => {
		const { state, iterable } = closableSource([0, 1, 2, 3, 4, 5]);
		const source = spyIterable([0, 1, 2, 3, 4, 5]);
		expect(collectToArray(slice(iterable, 1, 3))).toEqual([1, 2]);
		expect(state.closed).toBe(true);
		collectToArray(slice(source, 1, 3));
		expect(source.stats.reads).toBe(3);
	});

	test('slice works on an infinite source with non-negative indexes', () => {
		const { stats, iterable } = infiniteSource();
		expect(collectToArray(slice(iterable, 2, 5))).toEqual([2, 3, 4]);
		expect(stats).toEqual({ reads: 5, closed: true });
	});

	test('slice with a negative end yields lazily, |end| values behind the source', () => {
		const { stats, iterable } = infiniteSource();
		expect(collectToArray(take(slice(iterable, 1, -3), 2))).toEqual([1, 2]);
		expect(stats).toEqual({ reads: 6, closed: true });
	});

	test('slice with a negative start reads the whole source before yielding', () => {
		const source = spyIterable([0, 1, 2, 3, 4]);
		const it = slice(source, -2)[Symbol.iterator]();
		expect(it.next()).toEqual({ done: false, value: 3 });
		expect(source.stats.reads).toBe(5);
		expect(it.next()).toEqual({ done: false, value: 4 });
		expect(it.next().done).toBe(true);
		expect(it.next().done).toBe(true);
	});

	test('return() closes the source', () => {
		for (const [start, end] of [[0, 4], [0, -1]]) {
			const { state, iterable } = closableSource([0, 1, 2, 3, 4]);
			const it = slice(iterable, start, end)[Symbol.iterator]();
			it.next();
			it.return!();
			expect(state.closed, `slice(source, ${start}, ${end})`).toBe(true);
		}
	});

	test.each([
		{ start: 0, end: 5 },
		{ start: 0, end: -1 },
		{ start: -2, end: undefined }
	])('an error of the source propagates and does not close it: slice(source, $start, $end)', ({ start, end }) => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(3, error);
		expect(() => collectToArray(slice(iterable, start, end))).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

});
