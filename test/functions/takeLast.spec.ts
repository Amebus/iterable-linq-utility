import { describe, expect, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectTransformation } from '../_helpers/operationKind';

import {
	collectToArray,
	range,
	takeLast
} from '@/functions';
import { returnClosesTheIterator, withoutInputIterableThrowsException } from './functionsTestUtility';

describe('takeLast', () => {

	test('takeLast without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(takeLast);
	});

	test.each([-1, 2.5, NaN, Infinity, -Infinity, undefined, null, '2'])('takeLast(range(10), %s) -> throw exception', count => {
		expect(() => takeLast(range(10), count as any)).toThrow(/^\[iterable-linq-utility\/takeLast\] /);
	});

	test.each([
		{ end: 20, returnValue: 'a value' },
		{ end: 20, returnValue: 123 },
		{ end: 20, returnValue: null },
		{ end: 20 }
	])('takeLast(range($end), 10)[Symbol.iterator]().return() closes the iterator', ({ end, returnValue }) => {
		returnClosesTheIterator(takeLast(range(end), 10), returnValue);
	});

	test.each([
		{ values: [], count: 0, expectedResult: [] },
		{ values: [], count: 3, expectedResult: [] },
		{ values: [1, 2, 3, 4, 5], count: 0, expectedResult: [] },
		{ values: [1, 2, 3, 4, 5], count: 1, expectedResult: [5] },
		{ values: [1, 2, 3, 4, 5], count: 3, expectedResult: [3, 4, 5] },
		{ values: [1, 2, 3, 4, 5], count: 5, expectedResult: [1, 2, 3, 4, 5] },
		{ values: [1, 2, 3, 4, 5], count: 10, expectedResult: [1, 2, 3, 4, 5] }
	])('takeLast($values, $count) -> $expectedResult', ({ values, count, expectedResult }) => {
		expect(collectToArray(takeLast(values, count))).toEqual(expectedResult);
	});

	test('takeLast is transformation', () => {
		expectTransformation(source => takeLast(source, 3));
	});

	test('takeLast allows re-run', () => {
		const taken = takeLast(range(10), 3);
		expect(collectToArray(taken)).toEqual([7, 8, 9]);
		expect(collectToArray(taken)).toEqual([7, 8, 9]);
	});

	test('takeLast reads the whole source before the first value', () => {
		const source = spyIterable([1, 2, 3, 4, 5]);
		const it = takeLast(source, 2)[Symbol.iterator]();
		expect(it.next().value).toBe(4);
		expect(source.stats.reads).toBe(5);
	});

	test('takeLast(iterable, 0) does not read the source', () => {
		const source = spyIterable([1, 2, 3]);
		collectToArray(takeLast(source, 0));
		expect(source.stats.reads).toBe(0);
	});

	test('an error of the source propagates, without closing the source', () => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(3, error);
		expect(() => collectToArray(takeLast(iterable, 2))).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	test('return() closes the source', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		const it = takeLast(iterable, 2)[Symbol.iterator]();
		it.next();
		it.return!();
		expect(state.closed).toBe(true);
	});

	test('iterator stays done', () => {
		const it = takeLast([1, 2, 3], 2)[Symbol.iterator]();
		expect([it.next(), it.next()].map(r => r.value)).toEqual([2, 3]);
		for (let i = 0; i < 3; i++)
			expect(it.next().done).toBe(true);
	});

});
