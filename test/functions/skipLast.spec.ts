import { describe, expect, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectTransformation } from '../_helpers/operationKind';

import {
	collectToArray,
	range,
	skipLast,
	take
} from '@/functions';
import { returnClosesTheIterator, withoutInputIterableThrowsException } from './functionsTestUtility';

describe('skipLast', () => {

	test('skipLast without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(skipLast);
	});

	test.each([-1, 2.5, NaN, Infinity, -Infinity, undefined, null, '2'])('skipLast(range(10), %s) -> throw exception', count => {
		expect(() => skipLast(range(10), count as any)).toThrow(/^\[iterable-linq-utility\/skipLast\] /);
	});

	test.each([
		{ end: 20, returnValue: 'a value' },
		{ end: 20, returnValue: 123 },
		{ end: 20, returnValue: null },
		{ end: 20 }
	])('skipLast(range($end), 10)[Symbol.iterator]().return() closes the iterator', ({ end, returnValue }) => {
		returnClosesTheIterator(skipLast(range(end), 10), returnValue);
	});

	test.each([
		{ values: [], count: 0, expectedResult: [] },
		{ values: [], count: 3, expectedResult: [] },
		{ values: [1, 2, 3, 4, 5], count: 0, expectedResult: [1, 2, 3, 4, 5] },
		{ values: [1, 2, 3, 4, 5], count: 1, expectedResult: [1, 2, 3, 4] },
		{ values: [1, 2, 3, 4, 5], count: 3, expectedResult: [1, 2] },
		{ values: [1, 2, 3, 4, 5], count: 5, expectedResult: [] },
		{ values: [1, 2, 3, 4, 5], count: 10, expectedResult: [] }
	])('skipLast($values, $count) -> $expectedResult', ({ values, count, expectedResult }) => {
		expect(collectToArray(skipLast(values, count))).toEqual(expectedResult);
	});

	test('skipLast is transformation', () => {
		expectTransformation(source => skipLast(source, 3));
	});

	test('skipLast allows re-run', () => {
		const skipped = skipLast(range(10), 7);
		expect(collectToArray(skipped)).toEqual([0, 1, 2]);
		expect(collectToArray(skipped)).toEqual([0, 1, 2]);
	});

	test('skipLast yields a value once count more values have been read', () => {
		const source = spyIterable([1, 2, 3, 4, 5]);
		const it = skipLast(source, 2)[Symbol.iterator]();
		expect(it.next().value).toBe(1);
		expect(source.stats.reads).toBe(3);
	});

	test('skipLast(iterable, 0) yields each value as it is read', () => {
		const source = spyIterable([1, 2, 3]);
		const it = skipLast(source, 0)[Symbol.iterator]();
		expect(it.next().value).toBe(1);
		expect(source.stats.reads).toBe(1);
	});

	test('skipLast works with an infinite source', () => {
		const { stats, iterable } = infiniteSource();
		expect(collectToArray(take(skipLast(iterable, 3), 4))).toEqual([0, 1, 2, 3]);
		expect(stats.reads).toBe(7);
		expect(stats.closed).toBe(true);
	});

	test('an error of the source propagates, without closing the source', () => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(3, error);
		expect(() => collectToArray(skipLast(iterable, 2))).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	test('return() closes the source', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		const it = skipLast(iterable, 1)[Symbol.iterator]();
		it.next();
		it.return!();
		expect(state.closed).toBe(true);
	});

	test('iterator stays done', () => {
		const it = skipLast([1, 2, 3], 1)[Symbol.iterator]();
		expect([it.next(), it.next()].map(r => r.value)).toEqual([1, 2]);
		for (let i = 0; i < 3; i++)
			expect(it.next().done).toBe(true);
	});

});
