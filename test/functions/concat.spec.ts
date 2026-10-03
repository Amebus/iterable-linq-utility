import { describe, expect, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectTransformation } from '../_helpers/operationKind';

import {
	collectToArray,
	concat,
	range,
	take
} from '@/functions';
import { returnClosesTheIterator, withoutInputIterableThrowsException } from './functionsTestUtility';

describe('concat', () => {

	test('concat without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(concat);
	});

	test.each([undefined, null, 1, {}])('concat([1], [2], %s) -> throw exception', other => {
		expect(() => concat([1], [2], other as any)).toThrow('[iterable-linq-utility/concat] ');
	});

	test.each([
		{ end: 20, returnValue: 'a value' },
		{ end: 20, returnValue: 123 },
		{ end: 20, returnValue: null },
		{ end: 1 },
		{ end: 0 }
	])('concat(range($end), [97, 98, 99])[Symbol.iterator]().return() closes the iterator', ({ end, returnValue }) => {
		returnClosesTheIterator(concat(range(end), [97, 98, 99]), returnValue);
	});

	test.each([
		{ values: [], others: [], expectedResult: [] },
		{ values: [1, 2], others: [], expectedResult: [1, 2] },
		{ values: [], others: [[1, 2]], expectedResult: [1, 2] },
		{ values: [1], others: [[2, 3]], expectedResult: [1, 2, 3] },
		{ values: [1], others: [[], [2], [], [3, 4]], expectedResult: [1, 2, 3, 4] },
		{ values: [], others: [[], []], expectedResult: [] }
	])('concat($values, ...$others) -> $expectedResult', ({ values, others, expectedResult }) => {
		expect(collectToArray(concat<number>(values, ...others))).toEqual(expectedResult);
	});

	test('concat reads any iterable, and the same iterable more than once', () => {
		const values = new Set([1, 2]);
		expect(collectToArray(concat(values, values, range(3, 5)))).toEqual([1, 2, 1, 2, 3, 4]);
		expect(collectToArray(concat<string>(['a'], 'bc'))).toEqual(['a', 'b', 'c']);
	});

	test('concat is transformation', () => {
		expectTransformation(source => concat(source, [6, 7]));
	});

	test('concat is transformation for the other iterables too', () => {
		expectTransformation(source => concat([0], source));
	});

	test('concat allows re-run', () => {
		const concatenated = concat(range(2), [5], range(7, 9));
		expect(collectToArray(concatenated)).toEqual([0, 1, 5, 7, 8]);
		expect(collectToArray(concatenated)).toEqual([0, 1, 5, 7, 8]);
	});

	test('concat opens each other iterable only when it is reached', () => {
		const second = spyIterable([2]);
		const third = spyIterable([3]);
		const it = concat([1], second, third)[Symbol.iterator]();
		expect(it.next().value).toBe(1);
		expect([second.stats.iterations, third.stats.iterations]).toEqual([0, 0]);
		expect(it.next().value).toBe(2);
		expect([second.stats.iterations, third.stats.iterations]).toEqual([1, 0]);
		expect(it.next().value).toBe(3);
		expect(third.stats.iterations).toBe(1);
		expect(it.next().done).toBe(true);
		expect(it.next().done).toBe(true);
	});

	test('concat works on an infinite source cut by take, without opening the others', () => {
		const { stats, iterable } = infiniteSource();
		const other = spyIterable([-1]);
		expect(collectToArray(take(concat(iterable, other), 3))).toEqual([0, 1, 2]);
		expect(stats).toEqual({ reads: 3, closed: true });
		expect(other.stats.iterations).toBe(0);
	});

	test('return() closes the iterable being read', () => {
		const first = closableSource([1]);
		const second = closableSource([2, 3]);
		const third = closableSource([4]);
		const it = concat(first.iterable, second.iterable, third.iterable)[Symbol.iterator]();
		it.next();
		it.next();
		it.return!();
		expect([first.state.closed, second.state.closed, third.state.closed]).toEqual([true, true, false]);
	});

	test('an error of an other iterable propagates and does not close it', () => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(2, error);
		const it = concat([0], iterable)[Symbol.iterator]();
		expect([it.next().value, it.next().value]).toEqual([0, 1]);
		expect(() => it.next()).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	test('an error opening an other iterable propagates, and return() still works', () => {
		const error = new Error('open');
		const other = { [Symbol.iterator]: (): Iterator<number> => { throw error; } };
		const it = concat([0], other)[Symbol.iterator]();
		expect(it.next().value).toBe(0);
		expect(() => it.next()).toThrow(error);
		expect(it.return!()).toEqual({ done: true, value: undefined });
		expect(it.next().done).toBe(true);
	});

});
