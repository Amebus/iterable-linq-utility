import { describe, expect, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectTransformation } from '../_helpers/operationKind';

import {
	collectToArray,
	range,
	reverse
} from '@/functions';
import { returnClosesTheIterator, withoutInputIterableThrowsException } from './functionsTestUtility';

describe('reverse', () => {

	test('reverse without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(reverse);
	});

	test.each([
		{ returnValue: 'a value' },
		{ returnValue: 123 },
		{ returnValue: null },
		{}
	])('reverse(range(20))[Symbol.iterator]().return() closes the iterator', ({ returnValue }) => {
		returnClosesTheIterator(reverse(range(20)), returnValue);
	});

	test.each([
		{ values: [], expectedResult: [] },
		{ values: [1], expectedResult: [1] },
		{ values: [1, 2, 3, 4, 5], expectedResult: [5, 4, 3, 2, 1] }
	])('reverse($values) -> $expectedResult', ({ values, expectedResult }) => {
		expect(collectToArray(reverse(values))).toEqual(expectedResult);
	});

	test('reverse does not change an array source', () => {
		const values = [1, 2, 3];
		collectToArray(reverse(values));
		expect(values).toEqual([1, 2, 3]);
	});

	test('reverse is transformation', () => {
		expectTransformation(source => reverse(source));
	});

	test('reverse allows re-run, reading the source again', () => {
		const source = spyIterable([1, 2, 3]);
		const reversed = reverse(source);
		expect(collectToArray(reversed)).toEqual([3, 2, 1]);
		expect(collectToArray(reversed)).toEqual([3, 2, 1]);
		expect(source.stats.reads).toBe(6);
	});

	test('reverse reads the whole source before the first value', () => {
		const source = spyIterable([1, 2, 3, 4, 5]);
		const it = reverse(source)[Symbol.iterator]();
		expect(it.next().value).toBe(5);
		expect(source.stats.reads).toBe(5);
	});

	test('an error of the source propagates, without closing the source', () => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(3, error);
		expect(() => collectToArray(reverse(iterable))).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	test('return() after the first value stops the iterator', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		const it = reverse(iterable)[Symbol.iterator]();
		expect(it.next().value).toBe(3);
		expect(state.closed).toBe(true);
		it.return!();
		expect(it.next().done).toBe(true);
	});

	test('iterator stays done', () => {
		const it = reverse([1, 2])[Symbol.iterator]();
		expect([it.next(), it.next()].map(r => r.value)).toEqual([2, 1]);
		for (let i = 0; i < 3; i++)
			expect(it.next().done).toBe(true);
	});

});
