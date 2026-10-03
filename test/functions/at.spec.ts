import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectAction } from '../_helpers/operationKind';

import {
	at,
	filter,
	range
} from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

describe('at', () => {

	test('at without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(at);
	});

	test.each([1.5, -0.5, NaN, Infinity, -Infinity, undefined, null, '1', BigInt(1)])('at(iterable, %s) -> throw exception without reading the source', index => {
		const source = spyIterable([1, 2]);
		expect(() => at(source, index as never)).toThrow('The "index" parameter must be an integer');
		expect(source.stats).toEqual({ iterations: 0, reads: 0 });
	});

	test.each([
		{ values: [], index: 0, expectedResult: undefined },
		{ values: [], index: -1, expectedResult: undefined },
		{ values: [10, 20, 30], index: 0, expectedResult: 10 },
		{ values: [10, 20, 30], index: 2, expectedResult: 30 },
		{ values: [10, 20, 30], index: 3, expectedResult: undefined },
		{ values: [10, 20, 30], index: -1, expectedResult: 30 },
		{ values: [10, 20, 30], index: -3, expectedResult: 10 },
		{ values: [10, 20, 30], index: -4, expectedResult: undefined },
		{ values: [10, 20, 30, 40, 50], index: -2, expectedResult: 40 }
	])('at($values, $index) -> $expectedResult', ({ values, index, expectedResult }) => {
		expect(at(values, index)).toBe(expectedResult);
		expect(at(values, index)).toBe(values.at(index));
	});

	test('at(-0) is at(0)', () => {
		expect(at([10, 20], -0)).toBe(10);
	});

	test('a negative index works with every length and wrap of the buffer', () => {
		for (let length = 0; length <= 7; length++) {
			const values = Array.from({ length }, (_, i) => i);
			for (let index = -9; index <= -1; index++)
				expect(at(values, index), `length ${length}, index ${index}`).toBe(values.at(index));
		}
	});

	test('at works on a string', () => {
		expect(at('banana', 2)).toBe('n');
		expect(at('banana', -1)).toBe('a');
	});

	test('at counts the values of the iterable it receives', () => {
		const evens = filter(range(10), v => v % 2 === 0);
		expect(at(evens, 1)).toBe(2);
		expect(at(evens, -1)).toBe(8);
	});

	test('a non-negative index reads only up to the value', () => {
		const source = spyIterable([1, 2, 3, 4, 5]);
		expect(at(source, 2)).toBe(3);
		expect(source.stats.reads).toBe(3);
	});

	test('a non-negative index past the end reads the whole source', () => {
		const source = spyIterable([1, 2, 3]);
		expect(at(source, 5)).toBeUndefined();
		expect(source.stats.reads).toBe(3);
	});

	test('a non-negative index terminates on an infinite source and closes it', () => {
		const { stats, iterable } = infiniteSource();
		expect(at(iterable, 3)).toBe(3);
		expect(stats).toEqual({ reads: 4, closed: true });
	});

	test('a non-negative index closes the source after the value', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(at(iterable, 1)).toBe(2);
		expect(state.closed).toBe(true);
	});

	test('a negative index reads the whole source once', () => {
		const source = spyIterable([1, 2, 3, 4, 5]);
		expect(at(source, -2)).toBe(4);
		expect(source.stats).toEqual({ iterations: 1, reads: 5 });
	});

	test('a negative index does not terminate on an infinite source', () => {
		const { stats, iterable } = infiniteSource(10);
		expect(() => at(iterable, -1)).toThrow('infiniteSource: read more than 10 values');
		expect(stats.closed).toBe(true);
	});

	test('at is action', () => {
		expectAction(source => at(source, 1));
		expectAction(source => at(source, -1));
	});

	test('at runs again on every call', () => {
		const values = range(5);
		expect(at(values, -2)).toBe(3);
		expect(at(values, -2)).toBe(3);
	});

	test.each([1, -1])('a source error propagates unchanged and does not close the source (index %i)', index => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(2, error);
		expect(() => at(iterable, index > 0 ? 5 : index)).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	test('at returns the element type or undefined', () => {
		const values: (number | string)[] = [1, 'two'];
		expectTypeOf(at(values, 0)).toEqualTypeOf<number | string | undefined>();
		expect(at(values, -1)).toBe('two');
	});

});
