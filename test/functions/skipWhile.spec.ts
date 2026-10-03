import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectTransformation } from '../_helpers/operationKind';

import {
	collectToArray,
	range,
	skipWhile,
	take
} from '@/functions';
import { returnClosesTheIterator, withoutInputIterableThrowsException } from './functionsTestUtility';

describe('skipWhile', () => {

	test('skipWhile without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(skipWhile);
	});

	test.each([undefined, null, false, 0, 'predicate', {}])('skipWhile(iterable, %j) -> throw exception without reading the source', predicate => {
		const source = spyIterable([1, 2]);
		expect(() => skipWhile(source, predicate as never)).toThrow(new Error('[iterable-linq-utility/skipWhile] The "predicate" function must be provided'));
		expect(source.stats).toEqual({ iterations: 0, reads: 0 });
	});

	test.each([
		{ end: 20, returnValue: 'a value' },
		{ end: 20, returnValue: 123 },
		{ end: 20, returnValue: null },
		{ end: 20 }
	])('skipWhile(range($end), v => v < 10)[Symbol.iterator]().return() closes the iterator', ({ end, returnValue }) => {
		returnClosesTheIterator(skipWhile(range(end), v => v < 10), returnValue);
	});

	test.each([
		{ values: [], expectedResult: [] },
		{ values: [1, 2, 3], expectedResult: [] },
		{ values: [5, 1, 2], expectedResult: [5, 1, 2] },
		{ values: [1, 2, 5, 3, 1], expectedResult: [5, 3, 1] },
		{ values: [1, 4], expectedResult: [4] }
	])('skipWhile($values, v => v < 4) -> $expectedResult', ({ values, expectedResult }) => {
		expect(collectToArray(skipWhile(values, v => v < 4))).toEqual(expectedResult);
	});

	test('skipWhile stops calling the predicate after the first rejected value', () => {
		const calls: [string, number][] = [];
		const result = skipWhile(['a', 'b', 'c', 'd'], (value, index) => {
			calls.push([value, index]);
			return index < 2;
		});
		expect(collectToArray(result)).toEqual(['c', 'd']);
		expect(calls).toEqual([['a', 0], ['b', 1], ['c', 2]]);
	});

	test('skipWhile is transformation', () => {
		expectTransformation(source => skipWhile(source, v => v < 2));
	});

	test('skipWhile allows re-run and skips again on every run', () => {
		const indexes: number[] = [];
		const skipped = skipWhile(range(5), (v, index) => {
			indexes.push(index);
			return v < 3;
		});
		expect(collectToArray(skipped)).toEqual([3, 4]);
		expect(collectToArray(skipped)).toEqual([3, 4]);
		expect(indexes).toEqual([0, 1, 2, 3, 0, 1, 2, 3]);
	});

	test('skipWhile reads only up to the next value', () => {
		const source = spyIterable([1, 2, 5, 3, 4]);
		const it = skipWhile(source, v => v < 4)[Symbol.iterator]();
		expect(source.stats.reads).toBe(0);
		expect(it.next()).toEqual({ done: false, value: 5 });
		expect(source.stats.reads).toBe(3);
		expect(it.next()).toEqual({ done: false, value: 3 });
		expect(source.stats.reads).toBe(4);
	});

	test('skipWhile works on an infinite source combined with take', () => {
		const { stats, iterable } = infiniteSource();
		expect(collectToArray(take(skipWhile(iterable, v => v < 3), 2))).toEqual([3, 4]);
		expect(stats).toEqual({ reads: 5, closed: true });
	});

	test('return() closes the source', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		const it = skipWhile(iterable, v => v < 2)[Symbol.iterator]();
		it.next();
		it.return!();
		expect(state.closed).toBe(true);
	});

	test('a predicate error closes the source and propagates unchanged', () => {
		const error = new Error('predicate');
		const { state, iterable } = closableSource([1, 2, 3]);
		const it = skipWhile(iterable, v => {
			if (v === 2)
				throw error;
			return true;
		})[Symbol.iterator]();
		expect(() => it.next()).toThrow(error);
		expect(state.closed).toBe(true);
		expect(it.next().done).toBe(true);
	});

	test.each([
		{ phase: 'while skipping', failAt: 2 },
		{ phase: 'after skipping', failAt: 4 }
	])('a source error $phase propagates unchanged and does not close the source', ({ failAt }) => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(failAt, error);
		const it = skipWhile(iterable, v => v < 3)[Symbol.iterator]();
		if (failAt > 3)
			expect(it.next().value).toBe(3);
		expect(() => it.next()).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	test('iterator stays done', () => {
		const it = skipWhile([1, 5, 3], v => v < 4)[Symbol.iterator]();
		expect([it.next(), it.next()].map(r => r.value)).toEqual([5, 3]);
		for (let i = 0; i < 3; i++)
			expect(it.next().done).toBe(true);
	});

	test('skipWhile preserves the element type and infers the predicate arguments', () => {
		const values: (number | string)[] = [1, 'two'];
		const result = skipWhile(values, (value, index) => {
			expectTypeOf(value).toEqualTypeOf<number | string>();
			expectTypeOf(index).toEqualTypeOf<number>();
			return typeof value === 'number';
		});
		expectTypeOf(result).toEqualTypeOf<Iterable<number | string>>();
		expect(collectToArray(result)).toEqual(['two']);
	});

});
