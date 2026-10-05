import { describe, expect, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectTransformation } from '../_helpers/operationKind';

import {
	collectToArray,
	defaultIfEmpty,
	empty,
	range,
	take
} from '@/functions';
import { returnClosesTheIterator, withoutInputIterableThrowsException } from './functionsTestUtility';

describe('defaultIfEmpty', () => {

	test('defaultIfEmpty without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(defaultIfEmpty);
	});

	test.each([
		{ returnValue: 'a value' },
		{ returnValue: 123 },
		{ returnValue: null },
		{}
	])('defaultIfEmpty(range(20), -1)[Symbol.iterator]().return() closes the iterator', ({ returnValue }) => {
		returnClosesTheIterator(defaultIfEmpty(range(20), -1), returnValue);
	});

	test.each([
		{ values: [], value: 0, expectedResult: [0] },
		{ values: [], value: undefined, expectedResult: [undefined] },
		{ values: [1], value: 0, expectedResult: [1] },
		{ values: [1, 2, 3], value: 0, expectedResult: [1, 2, 3] },
		{ values: [undefined], value: 0, expectedResult: [undefined] }
	])('defaultIfEmpty($values, $value) -> $expectedResult', ({ values, value, expectedResult }) => {
		expect(collectToArray(defaultIfEmpty<number | undefined>(values, value))).toEqual(expectedResult);
	});

	test('defaultIfEmpty(empty(), value) yields value', () => {
		expect(collectToArray(defaultIfEmpty(empty<string>(), 'none'))).toEqual(['none']);
	});

	test('defaultIfEmpty is transformation', () => {
		expectTransformation(source => defaultIfEmpty(source, 0));
	});

	test('defaultIfEmpty allows re-run', () => {
		const withDefault = defaultIfEmpty([] as number[], 7);
		expect(collectToArray(withDefault)).toEqual([7]);
		expect(collectToArray(withDefault)).toEqual([7]);
	});

	test('defaultIfEmpty yields each value as it is read', () => {
		const source = spyIterable([1, 2, 3]);
		const it = defaultIfEmpty(source, 0)[Symbol.iterator]();
		expect(it.next().value).toBe(1);
		expect(source.stats.reads).toBe(1);
	});

	test('defaultIfEmpty works with an infinite source', () => {
		const { stats, iterable } = infiniteSource();
		expect(collectToArray(take(defaultIfEmpty(iterable, -1), 3))).toEqual([0, 1, 2]);
		expect(stats.closed).toBe(true);
	});

	test('the source is not read again after its end', () => {
		let reads = 0;
		const source = {
			[Symbol.iterator]: () => ({
				next: () => {
					reads++;
					return { done: true as const, value: undefined };
				}
			})
		};
		const it = defaultIfEmpty<number>(source, 0)[Symbol.iterator]();
		expect([it.next(), it.next(), it.next()].map(r => r.done)).toEqual([false, true, true]);
		expect(reads).toBe(1);
	});

	test('an error of the source propagates, without closing the source', () => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(3, error);
		expect(() => collectToArray(defaultIfEmpty(iterable, 0))).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	test('return() closes the source', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		const it = defaultIfEmpty(iterable, 0)[Symbol.iterator]();
		it.next();
		it.return!();
		expect(state.closed).toBe(true);
	});

	test('iterator stays done', () => {
		const it = defaultIfEmpty([1, 2], 0)[Symbol.iterator]();
		expect([it.next(), it.next()].map(r => r.value)).toEqual([1, 2]);
		for (let i = 0; i < 3; i++)
			expect(it.next().done).toBe(true);
	});

});
