import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectAction } from '../_helpers/operationKind';

import {
	findLast,
	range
} from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

describe('findLast', () => {

	test('findLast without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(findLast);
	});

	test.each([undefined, null, false, 0, 'predicate', {}])('findLast(iterable, %j) -> throw exception without reading the source', predicate => {
		const source = spyIterable([1, 2]);
		expect(() => findLast(source, predicate as never)).toThrow('The "predicate" function must be provided');
		expect(source.stats).toEqual({ iterations: 0, reads: 0 });
	});

	test.each([
		{ values: [], expectedResult: undefined },
		{ values: [1, 2, 3], expectedResult: undefined },
		{ values: [5], expectedResult: 5 },
		{ values: [1, 5, 6, 2], expectedResult: 6 },
		{ values: [7, 1, 2, 3], expectedResult: 7 }
	])('findLast($values, v => v > 4) -> $expectedResult', ({ values, expectedResult }) => {
		expect(findLast(values, v => v > 4)).toBe(expectedResult);
	});

	test('findLast returns the found value itself', () => {
		const first = { id: 1 };
		const second = { id: 1 };
		expect(findLast([first, second], v => v.id === 1)).toBe(second);
	});

	test('findLast returns undefined for an accepted undefined value, as for no match', () => {
		const values = [1, undefined, 3];
		expect(findLast(values, v => v === undefined)).toBeUndefined();
		expect(findLast(values, v => v === 4)).toBeUndefined();
	});

	test('findLast works on a string', () => {
		expect(findLast('banana', v => v !== 'a')).toBe('n');
	});

	test('findLast calls the predicate on every value with its index', () => {
		const calls: [string, number][] = [];
		expect(findLast(['a', 'b', 'c'], (value, index) => {
			calls.push([value, index]);
			return index < 2;
		})).toBe('b');
		expect(calls).toEqual([['a', 0], ['b', 1], ['c', 2]]);
	});

	test('findLast reads the whole source once', () => {
		const source = spyIterable([1, 5, 2, 6, 3]);
		expect(findLast(source, v => v > 4)).toBe(6);
		expect(source.stats).toEqual({ iterations: 1, reads: 5 });
	});

	test('findLast does not terminate on an infinite source', () => {
		const { stats, iterable } = infiniteSource(10);
		expect(() => findLast(iterable, v => v === 3)).toThrow('infiniteSource: read more than 10 values');
		expect(stats.closed).toBe(true);
	});

	test('findLast is action', () => {
		expectAction(source => findLast(source, v => v > 1));
	});

	test('findLast runs again on every call', () => {
		const values = range(5);
		expect(findLast(values, v => v < 3)).toBe(2);
		expect(findLast(values, v => v < 3)).toBe(2);
	});

	test('findLast reaches the end of the source', () => {
		const { state, iterable } = closableSource([1, 5, 3]);
		expect(findLast(iterable, v => v > 4)).toBe(5);
		expect(state.closed).toBe(true);
	});

	test('a predicate error closes the source and propagates unchanged', () => {
		const error = new Error('predicate');
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(() => findLast(iterable, () => { throw error; })).toThrow(error);
		expect(state.closed).toBe(true);
	});

	test('a source error propagates unchanged and does not close the source', () => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(2, error);
		expect(() => findLast(iterable, () => true)).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	test('a type guard narrows the result', () => {
		const values: (number | string)[] = [1, 'two', 3, 'four', 5];
		const result = findLast(values, (value): value is string => typeof value === 'string');
		expectTypeOf(result).toEqualTypeOf<string | undefined>();
		expect(result).toBe('four');
	});

	test('a boolean predicate keeps the element type and infers its arguments', () => {
		const values: (number | string)[] = [1, 'two'];
		const result = findLast(values, (value, index) => {
			expectTypeOf(value).toEqualTypeOf<number | string>();
			expectTypeOf(index).toEqualTypeOf<number>();
			return index === 0;
		});
		expectTypeOf(result).toEqualTypeOf<number | string | undefined>();
		expect(result).toBe(1);
	});

});
