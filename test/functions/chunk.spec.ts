import { describe, expect, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectTransformation } from '../_helpers/operationKind';

import {
	chunk,
	collectToArray,
	range,
	take
} from '@/functions';
import { returnClosesTheIterator, withoutInputIterableThrowsException } from './functionsTestUtility';

describe('chunk', () => {

	test('chunk without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(chunk);
	});

	test.each([0, -1, 2.5, NaN, Infinity, -Infinity, undefined, null, '2'])('chunk(range(10), %s) -> throw exception', size => {
		expect(() => chunk(range(10), size as any)).toThrow(new Error('[iterable-linq-utility/chunk] The "size" parameter must be a positive integer'));
	});

	test.each([
		{ returnValue: 'a value' },
		{ returnValue: 123 },
		{ returnValue: null },
		{}
	])('chunk(range(20), 3)[Symbol.iterator]().return() closes the iterator', ({ returnValue }) => {
		returnClosesTheIterator(chunk(range(20), 3), returnValue);
	});

	test.each([
		{ values: [], size: 1, expectedResult: [] },
		{ values: [], size: 3, expectedResult: [] },
		{ values: [1, 2, 3, 4, 5], size: 1, expectedResult: [[1], [2], [3], [4], [5]] },
		{ values: [1, 2, 3, 4, 5], size: 2, expectedResult: [[1, 2], [3, 4], [5]] },
		{ values: [1, 2, 3, 4, 5, 6], size: 3, expectedResult: [[1, 2, 3], [4, 5, 6]] },
		{ values: [1, 2, 3, 4, 5], size: 5, expectedResult: [[1, 2, 3, 4, 5]] },
		{ values: [1, 2, 3, 4, 5], size: 10, expectedResult: [[1, 2, 3, 4, 5]] }
	])('chunk($values, $size) -> $expectedResult', ({ values, size, expectedResult }) => {
		expect(collectToArray(chunk(values, size))).toEqual(expectedResult);
	});

	test('chunk is transformation', () => {
		expectTransformation(source => chunk(source, 2));
	});

	test('chunk allows re-run', () => {
		const chunks = chunk(range(5), 2);
		expect(collectToArray(chunks)).toEqual([[0, 1], [2, 3], [4]]);
		expect(collectToArray(chunks)).toEqual([[0, 1], [2, 3], [4]]);
	});

	test('each chunk is a new array', () => {
		const [a, b] = collectToArray(chunk([1, 2, 3, 4], 2));
		a.push(99);
		expect(b).toEqual([3, 4]);
		const runs = chunk([1, 2], 2);
		expect(collectToArray(runs)[0]).not.toBe(collectToArray(runs)[0]);
	});

	test('chunk reads only the values of the chunk it yields', () => {
		const source = spyIterable([1, 2, 3, 4, 5]);
		const it = chunk(source, 2)[Symbol.iterator]();
		expect(it.next().value).toEqual([1, 2]);
		expect(source.stats.reads).toBe(2);
	});

	test('chunk works with an infinite source', () => {
		const { stats, iterable } = infiniteSource();
		expect(collectToArray(take(chunk(iterable, 3), 2))).toEqual([[0, 1, 2], [3, 4, 5]]);
		expect(stats.reads).toBe(6);
		expect(stats.closed).toBe(true);
	});

	test('an error of the source propagates, without closing the source', () => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(3, error);
		expect(() => collectToArray(chunk(iterable, 2))).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	test('return() closes the source', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		const it = chunk(iterable, 1)[Symbol.iterator]();
		it.next();
		it.return!();
		expect(state.closed).toBe(true);
	});

	test('iterator stays done', () => {
		const it = chunk([1, 2, 3], 2)[Symbol.iterator]();
		expect([it.next(), it.next()].map(r => r.value)).toEqual([[1, 2], [3]]);
		for (let i = 0; i < 3; i++)
			expect(it.next().done).toBe(true);
	});

});
