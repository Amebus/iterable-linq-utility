import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectAction } from '../_helpers/operationKind';

import {
	average,
	filter,
	range
} from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

describe('average', () => {

	test('average without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(average);
	});

	test.each([null, false, 0, 'selector', {}])('average(iterable, %j) -> throw exception without reading the source', selector => {
		const source = spyIterable([1, 2]);
		expect(() => average(source, selector as never)).toThrow(new Error('[iterable-linq-utility/average] The "selector" function must be provided'));
		expect(source.stats).toEqual({ iterations: 0, reads: 0 });
	});

	test.each([
		{ values: [], expectedResult: undefined },
		{ values: [5], expectedResult: 5 },
		{ values: [1, 2, 3, 4], expectedResult: 2.5 },
		{ values: [-1, 1.5, -0.5], expectedResult: 0 }
	])('average($values) -> $expectedResult', ({ values, expectedResult }) => {
		expect(average(values)).toBe(expectedResult);
		expect(average(values, undefined)).toBe(expectedResult);
	});

	test.each([
		{ values: [1, Number.NaN, 2], expectedResult: Number.NaN },
		{ values: [1, Number.POSITIVE_INFINITY], expectedResult: Number.POSITIVE_INFINITY },
		{ values: [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY], expectedResult: Number.NaN }
	])('average($values) -> $expectedResult, like +', ({ values, expectedResult }) => {
		expect(average(values)).toBe(expectedResult);
	});

	test.each([
		{ values: [], expectedResult: undefined },
		{ values: ['a', 'bb', 'ccc'], expectedResult: 2 }
	])('average($values, v => v.length) -> $expectedResult', ({ values, expectedResult }) => {
		expect(average(values, v => v.length)).toBe(expectedResult);
	});

	test('average passes every value and its index to the selector', () => {
		const calls: [string, number][] = [];
		expect(average(['a', 'b', 'c'], (value, index) => {
			calls.push([value, index]);
			return index;
		})).toBe(1);
		expect(calls).toEqual([['a', 0], ['b', 1], ['c', 2]]);
	});

	test.each([false, true])('average reads the whole source once (selector: %s)', withSelector => {
		const source = spyIterable([1, 2, 3]);
		expect(withSelector ? average(source, v => v * 2) : average(source)).toBe(withSelector ? 4 : 2);
		expect(source.stats).toEqual({ iterations: 1, reads: 3 });
	});

	test('average is action', () => {
		expectAction(source => average(source));
		expectAction(source => average(source, v => v * 2));
	});

	test('average runs again on every call', () => {
		const evens = filter(range(10), v => v % 2 === 0);
		expect(average(evens)).toBe(4);
		expect(average(evens)).toBe(4);
	});

	test('average reaches the end of the source', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(average(iterable)).toBe(2);
		expect(state.closed).toBe(true);
	});

	test('a selector error closes the source and propagates unchanged', () => {
		const error = new Error('selector');
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(() => average(iterable, () => { throw error; })).toThrow(error);
		expect(state.closed).toBe(true);
	});

	test.each([false, true])('a source error propagates unchanged and does not close the source (selector: %s)', withSelector => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(2, error);
		expect(() => (withSelector ? average(iterable, v => v) : average(iterable))).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	test('average accepts only numbers without a selector and infers the selector arguments', () => {
		// @ts-expect-error without a selector the values must be numbers
		expect(average(['1', '2'])).toBe(6);
		const values: (number | string)[] = [1, 'two'];
		const result = average(values, (value, index) => {
			expectTypeOf(value).toEqualTypeOf<number | string>();
			expectTypeOf(index).toEqualTypeOf<number>();
			return typeof value === 'string' ? value.length : value;
		});
		expectTypeOf(result).toEqualTypeOf<number | undefined>();
		expect(result).toBe(2);
	});

});
