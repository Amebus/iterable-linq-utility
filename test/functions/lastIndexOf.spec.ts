import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectAction } from '../_helpers/operationKind';

import {
	filter,
	lastIndexOf,
	range
} from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

describe('lastIndexOf', () => {

	test('lastIndexOf without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(lastIndexOf);
	});

	test.each([
		{ values: [], value: 1, expectedResult: -1 },
		{ values: [1, 2, 3], value: 4, expectedResult: -1 },
		{ values: [1, 2, 3], value: 1, expectedResult: 0 },
		{ values: [1, 2, 3, 2], value: 2, expectedResult: 3 },
		{ values: [2, 2, 2], value: 2, expectedResult: 2 },
		{ values: [2, 1, 3], value: 2, expectedResult: 0 }
	])('lastIndexOf($values, $value) -> $expectedResult', ({ values, value, expectedResult }) => {
		expect(lastIndexOf(values, value)).toBe(expectedResult);
	});

	test('lastIndexOf uses strict equality, like Array.prototype.lastIndexOf', () => {
		expect(lastIndexOf([NaN, 1, NaN], NaN)).toBe(-1);
		expect(lastIndexOf([-0, 1], 0)).toBe(0);
		expect(lastIndexOf([0, 1], -0)).toBe(0);
		expect(lastIndexOf([undefined, null], undefined)).toBe(0);
		expect(lastIndexOf([1], '1' as never)).toBe(-1);
	});

	test('lastIndexOf compares objects by reference', () => {
		const value = { id: 1 };
		expect(lastIndexOf([value, { id: 1 }], value)).toBe(0);
		expect(lastIndexOf([{ id: 1 }], value)).toBe(-1);
	});

	test('lastIndexOf works on a string', () => {
		expect(lastIndexOf('banana', 'a')).toBe(5);
		expect(lastIndexOf('banana', 'x')).toBe(-1);
	});

	test('lastIndexOf counts the values of the iterable it receives', () => {
		expect(lastIndexOf(filter([6, 1, 6, 3, 6, 5], v => v % 2 === 0), 6)).toBe(2);
	});

	test('lastIndexOf reads the whole source once', () => {
		const source = spyIterable([1, 5, 2, 5, 3]);
		expect(lastIndexOf(source, 5)).toBe(3);
		expect(source.stats).toEqual({ iterations: 1, reads: 5 });
	});

	test('lastIndexOf does not terminate on an infinite source', () => {
		const { stats, iterable } = infiniteSource(10);
		expect(() => lastIndexOf(iterable, 3)).toThrow('infiniteSource: read more than 10 values');
		expect(stats.closed).toBe(true);
	});

	test('lastIndexOf is action', () => {
		expectAction(source => lastIndexOf(source, 2));
	});

	test('lastIndexOf runs again on every call', () => {
		const values = range(5, 10);
		expect(lastIndexOf(values, 7)).toBe(2);
		expect(lastIndexOf(values, 7)).toBe(2);
	});

	test('lastIndexOf reaches the end of the source', () => {
		const { state, iterable } = closableSource([1, 5, 3]);
		expect(lastIndexOf(iterable, 5)).toBe(1);
		expect(state.closed).toBe(true);
	});

	test('a source error propagates unchanged and does not close the source', () => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(2, error);
		expect(() => lastIndexOf(iterable, 1)).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	test('lastIndexOf takes a value of the element type', () => {
		const values: (number | string)[] = [1, 'two'];
		expectTypeOf(lastIndexOf<number | string>).parameter(1).toEqualTypeOf<number | string>();
		expectTypeOf(lastIndexOf(values, 'two')).toEqualTypeOf<number>();
		expect(lastIndexOf(values, 'two')).toBe(1);
	});

});
