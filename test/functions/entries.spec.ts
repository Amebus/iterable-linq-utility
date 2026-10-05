import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectTransformation } from '../_helpers/operationKind';

import {
	collectToArray,
	entries,
	range,
	take
} from '@/functions';
import { returnClosesTheIterator, withoutInputIterableThrowsException } from './functionsTestUtility';

describe('entries', () => {

	test('entries without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(entries);
	});

	test('the error of a missing iterable names entries', () => {
		expect(() => entries(undefined as any)).toThrow(/^\[iterable-linq-utility\/entries\] /);
	});

	test.each([
		{ returnValue: 'a value' },
		{ returnValue: 123 },
		{ returnValue: null },
		{}
	])('entries(range(20))[Symbol.iterator]().return() closes the iterator', ({ returnValue }) => {
		returnClosesTheIterator(entries(range(20)), returnValue);
	});

	test.each([
		{ values: [], expectedResult: [] },
		{ values: ['a'], expectedResult: [[0, 'a']] },
		{ values: ['a', 'b', 'c'], expectedResult: [[0, 'a'], [1, 'b'], [2, 'c']] }
	])('entries($values) -> $expectedResult', ({ values, expectedResult }) => {
		expect(collectToArray(entries(values))).toEqual(expectedResult);
	});

	test('entries yields the pairs of Array.prototype.entries', () => {
		const values = [5, 4, 3];
		expect(collectToArray(entries(values))).toEqual([...values.entries()]);
	});

	test('entries is transformation', () => {
		expectTransformation(source => entries(source));
	});

	test('entries allows re-run, from index 0', () => {
		const pairs = entries(range(2));
		expect(collectToArray(pairs)).toEqual([[0, 0], [1, 1]]);
		expect(collectToArray(pairs)).toEqual([[0, 0], [1, 1]]);
	});

	test('entries works with an infinite source', () => {
		const { stats, iterable } = infiniteSource();
		expect(collectToArray(take(entries(iterable), 2))).toEqual([[0, 0], [1, 1]]);
		expect(stats.closed).toBe(true);
	});

	test('an error of the source propagates, without closing the source', () => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(2, error);
		expect(() => collectToArray(entries(iterable))).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	test('return() closes the source', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		const it = entries(iterable)[Symbol.iterator]();
		it.next();
		it.return!();
		expect(state.closed).toBe(true);
	});

	test('the values are index-value tuples', () => {
		expectTypeOf(entries(['a'])).toEqualTypeOf<Iterable<[number, string]>>();
	});

});
