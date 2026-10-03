import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectAction } from '../_helpers/operationKind';

import {
	filter,
	indexOf,
	range
} from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

describe('indexOf', () => {

	test('indexOf without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(indexOf);
	});

	test.each([
		{ values: [], value: 1, expectedResult: -1 },
		{ values: [1, 2, 3], value: 4, expectedResult: -1 },
		{ values: [1, 2, 3], value: 1, expectedResult: 0 },
		{ values: [1, 2, 3, 2], value: 2, expectedResult: 1 },
		{ values: [1, 2, 3], value: 3, expectedResult: 2 }
	])('indexOf($values, $value) -> $expectedResult', ({ values, value, expectedResult }) => {
		expect(indexOf(values, value)).toBe(expectedResult);
	});

	test('indexOf uses strict equality, like Array.prototype.indexOf', () => {
		expect(indexOf([1, NaN], NaN)).toBe(-1);
		expect(indexOf([-0], 0)).toBe(0);
		expect(indexOf([0], -0)).toBe(0);
		expect(indexOf([null, undefined], undefined)).toBe(1);
		expect(indexOf([1], '1' as never)).toBe(-1);
	});

	test('indexOf compares objects by reference', () => {
		const value = { id: 1 };
		expect(indexOf([{ id: 1 }], value)).toBe(-1);
		expect(indexOf([{ id: 1 }, value], value)).toBe(1);
	});

	test('indexOf works on a string', () => {
		expect(indexOf('banana', 'n')).toBe(2);
		expect(indexOf('banana', 'x')).toBe(-1);
	});

	test('indexOf counts the values of the iterable it receives', () => {
		expect(indexOf(filter(range(10), v => v % 2 === 0), 6)).toBe(3);
	});

	test('indexOf does not read past the first match', () => {
		const source = spyIterable([1, 2, 5, 3, 5]);
		expect(indexOf(source, 5)).toBe(2);
		expect(source.stats.reads).toBe(3);
	});

	test('indexOf reads the whole source when the value is missing', () => {
		const source = spyIterable([1, 2, 3]);
		expect(indexOf(source, 4)).toBe(-1);
		expect(source.stats.reads).toBe(3);
	});

	test('indexOf terminates on an infinite source that contains the value', () => {
		const { stats, iterable } = infiniteSource();
		expect(indexOf(iterable, 3)).toBe(3);
		expect(stats).toEqual({ reads: 4, closed: true });
	});

	test('indexOf is action', () => {
		expectAction(source => indexOf(source, 2));
	});

	test('indexOf runs again on every call', () => {
		const values = range(5, 10);
		expect(indexOf(values, 7)).toBe(2);
		expect(indexOf(values, 7)).toBe(2);
	});

	test('the first match closes the source', () => {
		const { state, iterable } = closableSource([1, 5, 3]);
		expect(indexOf(iterable, 5)).toBe(1);
		expect(state.closed).toBe(true);
	});

	test('a source error propagates unchanged and does not close the source', () => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(2, error);
		expect(() => indexOf(iterable, 0)).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	test('indexOf takes a value of the element type', () => {
		const values: (number | string)[] = [1, 'two'];
		expectTypeOf(indexOf<number | string>).parameter(1).toEqualTypeOf<number | string>();
		expectTypeOf(indexOf(values, 'two')).toEqualTypeOf<number>();
		expect(indexOf(values, 'two')).toBe(1);
	});

});
