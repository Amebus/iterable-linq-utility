import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectAction } from '../_helpers/operationKind';

import {
	includes,
	range
} from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

describe('includes', () => {

	test('includes without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(includes);
	});

	test.each([
		{ values: [], value: 1, expectedResult: false },
		{ values: [1, 2, 3], value: 4, expectedResult: false },
		{ values: [1, 2, 3], value: 1, expectedResult: true },
		{ values: [1, 2, 3], value: 3, expectedResult: true }
	])('includes($values, $value) -> $expectedResult', ({ values, value, expectedResult }) => {
		expect(includes(values, value)).toBe(expectedResult);
	});

	test('includes uses SameValueZero, like Array.prototype.includes', () => {
		expect(includes([1, NaN], NaN)).toBe(true);
		expect(includes([-0], 0)).toBe(true);
		expect(includes([0], -0)).toBe(true);
		expect(includes([undefined], undefined)).toBe(true);
		expect(includes([null], undefined)).toBe(false);
		expect(includes([1], '1' as never)).toBe(false);
	});

	test('includes compares objects by reference', () => {
		const value = { id: 1 };
		expect(includes([{ id: 1 }], value)).toBe(false);
		expect(includes([{ id: 1 }, value], value)).toBe(true);
	});

	test('includes works on a string', () => {
		expect(includes('banana', 'n')).toBe(true);
		expect(includes('banana', 'x')).toBe(false);
	});

	test('includes does not read past the first match', () => {
		const source = spyIterable([1, 2, 5, 3]);
		expect(includes(source, 5)).toBe(true);
		expect(source.stats.reads).toBe(3);
	});

	test('includes reads the whole source when the value is missing', () => {
		const source = spyIterable([1, 2, 3]);
		expect(includes(source, 4)).toBe(false);
		expect(source.stats.reads).toBe(3);
	});

	test('includes terminates on an infinite source that contains the value', () => {
		const { stats, iterable } = infiniteSource();
		expect(includes(iterable, 3)).toBe(true);
		expect(stats).toEqual({ reads: 4, closed: true });
	});

	test('includes is action', () => {
		expectAction(source => includes(source, 2));
	});

	test('includes runs again on every call', () => {
		const values = range(5);
		expect(includes(values, 4)).toBe(true);
		expect(includes(values, 4)).toBe(true);
	});

	test('the first match closes the source', () => {
		const { state, iterable } = closableSource([1, 5, 3]);
		expect(includes(iterable, 5)).toBe(true);
		expect(state.closed).toBe(true);
	});

	test('a source error propagates unchanged and does not close the source', () => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(2, error);
		expect(() => includes(iterable, 0)).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	test('includes takes a value of the element type', () => {
		const values: (number | string)[] = [1, 'two'];
		expectTypeOf(includes<number | string>).parameter(1).toEqualTypeOf<number | string>();
		expectTypeOf(includes(values, 'two')).toEqualTypeOf<boolean>();
		expect(includes(values, 'two')).toBe(true);
	});

});
