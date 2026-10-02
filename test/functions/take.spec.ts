import { describe, expect, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { expectTransformation } from '../_helpers/operationKind';

import {
	collectToArray,
	range,
	take
} from '@/functions';
import { returnClosesTheIterator, withoutInputIterableThrowsException } from './functionsTestUtility';

describe('take', () => {

	test('take without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(take);
	});

	test.each([-1, 2.5, NaN, Infinity, -Infinity, undefined, null, '2'])('take(range(10), %s) -> throw exception', count => {
		expect(() => take(range(10), count as any)).toThrow(Error);
	});

	test.each([
		{ end: 20, returnValue: 'a value' },
		{ end: 20, returnValue: 123 },
		{ end: 20, returnValue: null },
		{ end: 20 }
	])('take(range($end), 10)[Symbol.iterator]().return() closes the iterator', ({ end, returnValue }) => {
		returnClosesTheIterator(take(range(end), 10), returnValue);
	});

	test.each([
		{ values: [], count: 0, expectedResult: [] },
		{ values: [], count: 3, expectedResult: [] },
		{ values: [1, 2, 3, 4, 5], count: 0, expectedResult: [] },
		{ values: [1, 2, 3, 4, 5], count: 1, expectedResult: [1] },
		{ values: [1, 2, 3, 4, 5], count: 3, expectedResult: [1, 2, 3] },
		{ values: [1, 2, 3, 4, 5], count: 5, expectedResult: [1, 2, 3, 4, 5] },
		{ values: [1, 2, 3, 4, 5], count: 10, expectedResult: [1, 2, 3, 4, 5] }
	])('take($values, $count) -> $expectedResult', ({ values, count, expectedResult }) => {
		expect(collectToArray(take(values, count))).toEqual(expectedResult);
	});

	test('take is transformation', () => {
		expectTransformation(source => take(source, 3));
	});

	test('take allows re-run', () => {
		const taken = take(range(10), 3);
		expect(collectToArray(taken)).toEqual([0, 1, 2]);
		expect(collectToArray(taken)).toEqual([0, 1, 2]);
	});

	test('take reads an infinite source only up to count', () => {
		const { stats, iterable } = infiniteSource();
		expect(collectToArray(take(iterable, 4))).toEqual([0, 1, 2, 3]);
		expect(stats.reads).toBe(4);
	});

	test('take does not read past count', () => {
		const source = spyIterable([1, 2, 3, 4, 5]);
		collectToArray(take(source, 2));
		expect(source.stats.reads).toBe(2);
	});

	test('take(iterable, 0) does not read the source', () => {
		const source = spyIterable([1, 2, 3]);
		collectToArray(take(source, 0));
		expect(source.stats.reads).toBe(0);
	});

	test('reaching count closes the source', () => {
		const { state, iterable } = closableSource([1, 2, 3, 4, 5]);
		const it = take(iterable, 2)[Symbol.iterator]();
		it.next();
		it.next();
		expect(state.closed).toBe(false);
		expect(it.next().done).toBe(true);
		expect(state.closed).toBe(true);
	});

	test('return() closes the source', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		const it = take(iterable, 2)[Symbol.iterator]();
		it.next();
		it.return!();
		expect(state.closed).toBe(true);
	});

	test('iterator stays done', () => {
		const it = take([1, 2, 3], 2)[Symbol.iterator]();
		expect([it.next(), it.next()].map(r => r.value)).toEqual([1, 2]);
		for (let i = 0; i < 3; i++)
			expect(it.next().done).toBe(true);
	});

});
