import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectAction } from '../_helpers/operationKind';

import {
	range,
	single,
	take
} from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

const MORE_THAN_ONE_VALUE = new Error('[iterable-linq-utility/single] The iterable contains more than one value');
const MORE_THAN_ONE_MATCH = new Error('[iterable-linq-utility/single] More than one value satisfies the predicate');

describe('single', () => {

	test('single without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(single);
	});

	test.each([null, false, 0, 'predicate', {}])('single(iterable, %j) -> throw exception without reading the source', predicate => {
		const source = spyIterable([1, 2]);
		expect(() => single(source, predicate as never)).toThrow(new Error('[iterable-linq-utility/single] The "predicate" function must be provided'));
		expect(source.stats).toEqual({ iterations: 0, reads: 0 });
	});

	test.each([
		{ values: [], expectedResult: undefined },
		{ values: [5], expectedResult: 5 }
	])('single($values) -> $expectedResult', ({ values, expectedResult }) => {
		expect(single(values)).toBe(expectedResult);
		expect(single(values, undefined)).toBe(expectedResult);
	});

	test.each([
		{ values: [1, 2] },
		{ values: [1, 2, 3] }
	])('single($values) -> throw exception', ({ values }) => {
		expect(() => single(values)).toThrow(MORE_THAN_ONE_VALUE);
		expect(() => single(values, undefined)).toThrow(MORE_THAN_ONE_VALUE);
	});

	test.each([
		{ values: [], expectedResult: undefined },
		{ values: [1, 2, 3], expectedResult: undefined },
		{ values: [5], expectedResult: 5 },
		{ values: [1, 5, 2], expectedResult: 5 }
	])('single($values, v => v > 4) -> $expectedResult', ({ values, expectedResult }) => {
		expect(single(values, v => v > 4)).toBe(expectedResult);
	});

	test.each([
		{ values: [5, 6] },
		{ values: [1, 5, 2, 6, 3] }
	])('single($values, v => v > 4) -> throw exception', ({ values }) => {
		expect(() => single(values, v => v > 4)).toThrow(MORE_THAN_ONE_MATCH);
	});

	test('single returns the found value itself', () => {
		const first = { id: 1 };
		const second = { id: 2 };
		expect(single([first, second], v => v.id === 2)).toBe(second);
		expect(single([first])).toBe(first);
	});

	test('single returns undefined for a single undefined value, as for no value', () => {
		expect(single([undefined])).toBeUndefined();
		expect(single([1, undefined, 3], v => v === undefined)).toBeUndefined();
		expect(single([])).toBeUndefined();
	});

	test('single works on a string', () => {
		expect(single('a')).toBe('a');
		expect(single('banana', v => v === 'b')).toBe('b');
		expect(() => single('banana', v => v === 'a')).toThrow(MORE_THAN_ONE_MATCH);
	});

	test('single passes each value and its index until the second match', () => {
		const calls: [string, number][] = [];
		expect(() => single(['a', 'b', 'c', 'd', 'e'], (value, index) => {
			calls.push([value, index]);
			return index === 1 || index === 3;
		})).toThrow(MORE_THAN_ONE_MATCH);
		expect(calls).toEqual([['a', 0], ['b', 1], ['c', 2], ['d', 3]]);
	});

	test('single reads the whole source when there is at most one match', () => {
		const source = spyIterable([1, 5, 2]);
		expect(single(source, v => v > 4)).toBe(5);
		expect(source.stats).toEqual({ iterations: 1, reads: 3 });
	});

	test.each([false, true])('single stops at the second match and closes the source (predicate: %s)', withPredicate => {
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(() => (withPredicate ? single(iterable, () => true) : single(iterable))).toThrow(withPredicate ? MORE_THAN_ONE_MATCH : MORE_THAN_ONE_VALUE);
		expect(state.closed).toBe(true);
	});

	test('single terminates on an infinite source', () => {
		const { stats, iterable } = infiniteSource();
		expect(() => single(iterable)).toThrow(MORE_THAN_ONE_VALUE);
		expect(stats).toEqual({ reads: 2, closed: true });
	});

	test('single terminates on an infinite source with two matches', () => {
		const { stats, iterable } = infiniteSource();
		expect(() => single(iterable, v => v % 3 === 0)).toThrow(MORE_THAN_ONE_MATCH);
		expect(stats).toEqual({ reads: 4, closed: true });
	});

	test('single is action', () => {
		expectAction(source => single(source, v => v === 1));
		expectAction(source => single(take(source, 1)));
	});

	test('single runs again on every call', () => {
		const values = range(5);
		expect(single(values, v => v === 2)).toBe(2);
		expect(single(values, v => v === 2)).toBe(2);
	});

	test('single reaches the end of the source', () => {
		const { state, iterable } = closableSource([1]);
		expect(single(iterable)).toBe(1);
		expect(state.closed).toBe(true);
	});

	test('a predicate error closes the source and propagates unchanged', () => {
		const error = new Error('predicate');
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(() => single(iterable, () => { throw error; })).toThrow(error);
		expect(state.closed).toBe(true);
	});

	test.each([false, true])('a source error propagates unchanged and does not close the source (predicate: %s)', withPredicate => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(1, error);
		expect(() => (withPredicate ? single(iterable, () => false) : single(iterable))).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	test('a type guard narrows the result', () => {
		const values: (number | string)[] = [1, 'two', 3];
		const result = single(values, (value): value is string => typeof value === 'string');
		expectTypeOf(result).toEqualTypeOf<string | undefined>();
		expect(result).toBe('two');
	});

	test('a boolean predicate keeps the element type and infers its arguments', () => {
		const values: (number | string)[] = [1, 'two'];
		const result = single(values, (value, index) => {
			expectTypeOf(value).toEqualTypeOf<number | string>();
			expectTypeOf(index).toEqualTypeOf<number>();
			return index === 1;
		});
		expectTypeOf(result).toEqualTypeOf<number | string | undefined>();
		expect(result).toBe('two');
		expectTypeOf(() => single(values)).returns.toEqualTypeOf<number | string | undefined>();
	});

});
