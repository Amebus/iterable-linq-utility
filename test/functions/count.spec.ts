import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectAction } from '../_helpers/operationKind';

import {
	count,
	filter,
	range
} from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

describe('count', () => {

	test('count without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(count);
	});

	test.each([null, false, 0, 'predicate', {}])('count(iterable, %j) -> throw exception without reading the source', predicate => {
		const source = spyIterable([1, 2]);
		expect(() => count(source, predicate as never)).toThrow(new Error('[iterable-linq-utility/count] The "predicate" function must be provided'));
		expect(source.stats).toEqual({ iterations: 0, reads: 0 });
	});

	test.each([
		{ values: [], expectedResult: 0 },
		{ values: [1], expectedResult: 1 },
		{ values: [1, 2, 3], expectedResult: 3 },
		{ values: [undefined, null], expectedResult: 2 }
	])('count($values) -> $expectedResult', ({ values, expectedResult }) => {
		expect(count(values)).toBe(expectedResult);
		expect(count(values, undefined)).toBe(expectedResult);
	});

	test.each([
		{ values: [], expectedResult: 0 },
		{ values: [1, 2, 3], expectedResult: 0 },
		{ values: [5], expectedResult: 1 },
		{ values: [1, 5, 2, 6, 7], expectedResult: 3 }
	])('count($values, v => v > 4) -> $expectedResult', ({ values, expectedResult }) => {
		expect(count(values, v => v > 4)).toBe(expectedResult);
	});

	test('count works on a string', () => {
		expect(count('banana')).toBe(6);
		expect(count('banana', v => v === 'a')).toBe(3);
	});

	test('count passes every value and its index to the predicate', () => {
		const calls: [string, number][] = [];
		expect(count(['a', 'b', 'c'], (value, index) => {
			calls.push([value, index]);
			return index !== 1;
		})).toBe(2);
		expect(calls).toEqual([['a', 0], ['b', 1], ['c', 2]]);
	});

	test.each([false, true])('count reads the whole source once (predicate: %s)', withPredicate => {
		const source = spyIterable([1, 2, 3]);
		expect(withPredicate ? count(source, () => true) : count(source)).toBe(3);
		expect(source.stats).toEqual({ iterations: 1, reads: 3 });
	});

	test('count is action', () => {
		expectAction(source => count(source));
		expectAction(source => count(source, v => v > 1));
	});

	test('count runs again on every call', () => {
		const evens = filter(range(10), v => v % 2 === 0);
		expect(count(evens)).toBe(5);
		expect(count(evens)).toBe(5);
	});

	test('count reaches the end of the source', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(count(iterable)).toBe(3);
		expect(state.closed).toBe(true);
	});

	test('a predicate error closes the source and propagates unchanged', () => {
		const error = new Error('predicate');
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(() => count(iterable, () => { throw error; })).toThrow(error);
		expect(state.closed).toBe(true);
	});

	test.each([false, true])('a source error propagates unchanged and does not close the source (predicate: %s)', withPredicate => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(2, error);
		expect(() => (withPredicate ? count(iterable, () => true) : count(iterable))).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	test('count infers the predicate arguments', () => {
		const values: (number | string)[] = [1, 'two'];
		const result = count(values, (value, index) => {
			expectTypeOf(value).toEqualTypeOf<number | string>();
			expectTypeOf(index).toEqualTypeOf<number>();
			return typeof value === 'string';
		});
		expectTypeOf(result).toEqualTypeOf<number>();
		expect(result).toBe(1);
	});

});
