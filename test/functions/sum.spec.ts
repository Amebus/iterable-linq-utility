import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectAction } from '../_helpers/operationKind';

import {
	filter,
	range,
	sum
} from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

describe('sum', () => {

	test('sum without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(sum);
	});

	test.each([null, false, {}])('sum(iterable, %j) -> throw exception without reading the source', selector => {
		const source = spyIterable([1, 2]);
		expect(() => sum(source, selector as never)).toThrow(new Error('[iterable-linq-utility/sum] The "selector" must be a function or a property key'));
		expect(source.stats).toEqual({ iterations: 0, reads: 0 });
	});

	test.each([
		{ values: [], expectedResult: 0 },
		{ values: [5], expectedResult: 5 },
		{ values: [1, 2, 3], expectedResult: 6 },
		{ values: [-1, 1.5, -0.5], expectedResult: 0 }
	])('sum($values) -> $expectedResult', ({ values, expectedResult }) => {
		expect(sum(values)).toBe(expectedResult);
		expect(sum(values, undefined)).toBe(expectedResult);
	});

	test.each([
		{ values: [1, Number.NaN, 2], expectedResult: Number.NaN },
		{ values: [1, Number.POSITIVE_INFINITY], expectedResult: Number.POSITIVE_INFINITY },
		{ values: [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY], expectedResult: Number.NaN }
	])('sum($values) -> $expectedResult, like +', ({ values, expectedResult }) => {
		expect(sum(values)).toBe(expectedResult);
	});

	test.each([
		{ values: [], expectedResult: 0 },
		{ values: ['a', 'bb', 'ccc'], expectedResult: 6 }
	])('sum($values, v => v.length) -> $expectedResult', ({ values, expectedResult }) => {
		expect(sum(values, v => v.length)).toBe(expectedResult);
	});

	test('sum passes every value and its index to the selector', () => {
		const calls: [string, number][] = [];
		expect(sum(['a', 'b', 'c'], (value, index) => {
			calls.push([value, index]);
			return index;
		})).toBe(3);
		expect(calls).toEqual([['a', 0], ['b', 1], ['c', 2]]);
	});

	test.each([false, true])('sum reads the whole source once (selector: %s)', withSelector => {
		const source = spyIterable([1, 2, 3]);
		expect(withSelector ? sum(source, v => v * 2) : sum(source)).toBe(withSelector ? 12 : 6);
		expect(source.stats).toEqual({ iterations: 1, reads: 3 });
	});

	test('sum is action', () => {
		expectAction(source => sum(source));
		expectAction(source => sum(source, v => v * 2));
	});

	test('sum runs again on every call', () => {
		const evens = filter(range(10), v => v % 2 === 0);
		expect(sum(evens)).toBe(20);
		expect(sum(evens)).toBe(20);
	});

	test('sum reaches the end of the source', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(sum(iterable)).toBe(6);
		expect(state.closed).toBe(true);
	});

	test('a selector error closes the source and propagates unchanged', () => {
		const error = new Error('selector');
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(() => sum(iterable, () => { throw error; })).toThrow(error);
		expect(state.closed).toBe(true);
	});

	test.each([false, true])('a source error propagates unchanged and does not close the source (selector: %s)', withSelector => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(2, error);
		expect(() => (withSelector ? sum(iterable, v => v) : sum(iterable))).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	test('sum accepts only numbers without a selector and infers the selector arguments', () => {
		// @ts-expect-error without a selector the values must be numbers
		expect(sum(['1', '2'])).toBe('012');
		const values: (number | string)[] = [1, 'two'];
		const result = sum(values, (value, index) => {
			expectTypeOf(value).toEqualTypeOf<number | string>();
			expectTypeOf(index).toEqualTypeOf<number>();
			return typeof value === 'string' ? value.length : value;
		});
		expectTypeOf(result).toEqualTypeOf<number>();
		expect(result).toBe(4);
	});

	describe('with a property key', () => {
		const orders = [{ id: 1, price: 10, note: 'a' }, { id: 2, price: 5, note: 'b' }];

		test('gives the same sum as the equivalent selector', () => {
			expect(sum(orders, 'price')).toBe(sum(orders, o => o.price));
		});

		test('undefined still sums the values themselves', () => {
			expect(sum([1, 2], undefined)).toBe(3);
		});

		test('a null value throws a TypeError and closes the source', () => {
			const { state, iterable } = closableSource<{ price: number } | null>([{ price: 1 }, null, { price: 3 }]);
			expect(() => sum(iterable as Iterable<{ price: number }>, 'price')).toThrow(TypeError);
			expect(state.closed).toBe(true);
		});

		test('accepts only the keys whose value is a number', () => {
			// @ts-expect-error the value of note is a string
			sum(orders, 'note');
			const discounted: { discount?: number }[] = [{ discount: 1 }];
			// @ts-expect-error the value of discount can be undefined
			sum(discounted, 'discount');
			expectTypeOf(sum(orders, 'price')).toEqualTypeOf<number>();
		});
	});

	test('sums an index of tuples, such as the entries of a Map', () => {
		const prices = new Map([['a', 10], ['b', 5]]);
		expect(sum(prices, 1)).toBe(15);
		// @ts-expect-error the index 0 holds a string
		sum(prices, 0);
	});
});
