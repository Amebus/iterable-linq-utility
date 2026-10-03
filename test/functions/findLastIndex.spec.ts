import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectAction } from '../_helpers/operationKind';

import {
	filter,
	findLastIndex,
	range
} from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

describe('findLastIndex', () => {

	test('findLastIndex without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(findLastIndex);
	});

	test.each([undefined, null, false, 0, 'predicate', {}])('findLastIndex(iterable, %j) -> throw exception without reading the source', predicate => {
		const source = spyIterable([1, 2]);
		expect(() => findLastIndex(source, predicate as never)).toThrow('The "predicate" function must be provided');
		expect(source.stats).toEqual({ iterations: 0, reads: 0 });
	});

	test.each([
		{ values: [], expectedResult: -1 },
		{ values: [1, 2, 3], expectedResult: -1 },
		{ values: [5], expectedResult: 0 },
		{ values: [1, 5, 6, 2], expectedResult: 2 },
		{ values: [7, 1, 2, 3], expectedResult: 0 }
	])('findLastIndex($values, v => v > 4) -> $expectedResult', ({ values, expectedResult }) => {
		expect(findLastIndex(values, v => v > 4)).toBe(expectedResult);
	});

	test('findLastIndex finds an undefined value', () => {
		expect(findLastIndex([undefined, 1, undefined, 3], v => v === undefined)).toBe(2);
	});

	test('findLastIndex finds NaN with Number.isNaN', () => {
		expect(findLastIndex([NaN, 1, NaN, 2], v => Number.isNaN(v))).toBe(2);
	});

	test('findLastIndex works on a string', () => {
		expect(findLastIndex('banana', v => v === 'n')).toBe(4);
	});

	test('findLastIndex counts the values of the iterable it receives', () => {
		expect(findLastIndex(filter([6, 1, 6, 3, 6, 5], v => v % 2 === 0), v => v === 6)).toBe(2);
	});

	test('findLastIndex calls the predicate on every value with its index', () => {
		const calls: [string, number][] = [];
		expect(findLastIndex(['a', 'b', 'c'], (value, index) => {
			calls.push([value, index]);
			return index < 2;
		})).toBe(1);
		expect(calls).toEqual([['a', 0], ['b', 1], ['c', 2]]);
	});

	test('findLastIndex reads the whole source once', () => {
		const source = spyIterable([1, 5, 2, 6, 3]);
		expect(findLastIndex(source, v => v > 4)).toBe(3);
		expect(source.stats).toEqual({ iterations: 1, reads: 5 });
	});

	test('findLastIndex does not terminate on an infinite source', () => {
		const { stats, iterable } = infiniteSource(10);
		expect(() => findLastIndex(iterable, v => v === 3)).toThrow('infiniteSource: read more than 10 values');
		expect(stats.closed).toBe(true);
	});

	test('findLastIndex is action', () => {
		expectAction(source => findLastIndex(source, v => v > 1));
	});

	test('findLastIndex runs again on every call', () => {
		const values = range(5, 10);
		expect(findLastIndex(values, v => v < 8)).toBe(2);
		expect(findLastIndex(values, v => v < 8)).toBe(2);
	});

	test('findLastIndex reaches the end of the source', () => {
		const { state, iterable } = closableSource([1, 5, 3]);
		expect(findLastIndex(iterable, v => v > 4)).toBe(1);
		expect(state.closed).toBe(true);
	});

	test('a predicate error closes the source and propagates unchanged', () => {
		const error = new Error('predicate');
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(() => findLastIndex(iterable, () => { throw error; })).toThrow(error);
		expect(state.closed).toBe(true);
	});

	test('a source error propagates unchanged and does not close the source', () => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(2, error);
		expect(() => findLastIndex(iterable, () => true)).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	test('findLastIndex infers the predicate arguments', () => {
		const values: (number | string)[] = [1, 'two', 3];
		const result = findLastIndex(values, (value, index) => {
			expectTypeOf(value).toEqualTypeOf<number | string>();
			expectTypeOf(index).toEqualTypeOf<number>();
			return typeof value === 'number';
		});
		expectTypeOf(result).toEqualTypeOf<number>();
		expect(result).toBe(2);
	});

});
