import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectAction } from '../_helpers/operationKind';

import {
	range,
	sequenceEqual
} from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

const NOT_ITERABLE = '[iterable-linq-utility/sequenceEqual] The provided "sourceIterable" does not conform to the iterator protocol';

describe('sequenceEqual', () => {

	test('sequenceEqual without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(sequenceEqual);
	});

	test.each([undefined, null])('sequenceEqual(iterable, %j) -> throw exception without reading the source', other => {
		const source = spyIterable([1, 2]);
		expect(() => sequenceEqual(source, other as never)).toThrow(new Error('[iterable-linq-utility/sequenceEqual] The "sourceIterable" must be provided'));
		expect(source.stats).toEqual({ iterations: 0, reads: 0 });
	});

	test.each([0, {}])('sequenceEqual(iterable, %j) -> throw exception for an other that is not iterable', other => {
		expect(() => sequenceEqual([1], other as never)).toThrow(NOT_ITERABLE);
	});

	test.each([null, false, 0, 'equals', {}])('sequenceEqual(iterable, other, %j) -> throw exception without reading the sources', equals => {
		const source = spyIterable([1, 2]);
		const other = spyIterable([1, 2]);
		expect(() => sequenceEqual(source, other, equals as never)).toThrow(new Error('[iterable-linq-utility/sequenceEqual] The "equals" function must be provided'));
		expect(source.stats).toEqual({ iterations: 0, reads: 0 });
		expect(other.stats).toEqual({ iterations: 0, reads: 0 });
	});

	test.each([
		{ values: [], other: [], expectedResult: true },
		{ values: [1, 2, 3], other: [1, 2, 3], expectedResult: true },
		{ values: [1, 2, 3], other: [1, 2, 4], expectedResult: false },
		{ values: [1, 2, 3], other: [3, 2, 1], expectedResult: false },
		{ values: [1, 2], other: [1, 2, 3], expectedResult: false },
		{ values: [1, 2, 3], other: [1, 2], expectedResult: false },
		{ values: [], other: [1], expectedResult: false },
		{ values: [1], other: [], expectedResult: false }
	])('sequenceEqual($values, $other) -> $expectedResult', ({ values, other, expectedResult }) => {
		expect(sequenceEqual(values, other)).toBe(expectedResult);
		expect(sequenceEqual(values, other, undefined)).toBe(expectedResult);
	});

	test('sequenceEqual compares with === by default', () => {
		const item = { id: 1 };
		expect(sequenceEqual([item], [item])).toBe(true);
		expect(sequenceEqual([{ id: 1 }], [{ id: 1 }])).toBe(false);
		expect(sequenceEqual([Number.NaN], [Number.NaN])).toBe(false);
		expect(sequenceEqual([0], [-0])).toBe(true);
		expect(sequenceEqual<unknown>([1], ['1'])).toBe(false);
	});

	test('sequenceEqual compares with equals', () => {
		expect(sequenceEqual([{ id: 1 }, { id: 2 }], [{ id: 1 }, { id: 2 }], (a, b) => a.id === b.id)).toBe(true);
		expect(sequenceEqual([{ id: 1 }, { id: 2 }], [{ id: 1 }, { id: 3 }], (a, b) => a.id === b.id)).toBe(false);
		expect(sequenceEqual([Number.NaN], [Number.NaN], Object.is)).toBe(true);
	});

	test('sequenceEqual compares different kinds of iterables', () => {
		expect(sequenceEqual('abc', ['a', 'b', 'c'])).toBe(true);
		expect(sequenceEqual(range(3), new Set([0, 1, 2]))).toBe(true);
	});

	test('sequenceEqual passes the value of the iterable, then the value of other, to equals', () => {
		const calls: [string, string][] = [];
		expect(sequenceEqual(['a', 'b', 'c'], ['x', 'y', 'z'], (a, b) => {
			calls.push([a, b]);
			return b !== 'y';
		})).toBe(false);
		expect(calls).toEqual([['a', 'x'], ['b', 'y']]);
	});

	test('sequenceEqual stops at the first difference', () => {
		const source = spyIterable([1, 2, 3, 4]);
		const other = spyIterable([1, 5, 3, 4]);
		expect(sequenceEqual(source, other)).toBe(false);
		expect(source.stats).toEqual({ iterations: 1, reads: 2 });
		expect(other.stats).toEqual({ iterations: 1, reads: 2 });
	});

	test('sequenceEqual closes both sources at the first difference', () => {
		const source = closableSource([1, 2, 3]);
		const other = closableSource([1, 5, 3]);
		expect(sequenceEqual(source.iterable, other.iterable)).toBe(false);
		expect(source.state.closed).toBe(true);
		expect(other.state.closed).toBe(true);
	});

	test.each([
		{ values: [1, 2], other: [1, 2, 3] },
		{ values: [1, 2, 3], other: [1, 2] },
		{ values: [1, 2], other: [1, 2] }
	])('sequenceEqual($values, $other) ends or closes both sources', ({ values, other }) => {
		const first = closableSource(values);
		const second = closableSource(other);
		sequenceEqual(first.iterable, second.iterable);
		expect(first.state.closed).toBe(true);
		expect(second.state.closed).toBe(true);
	});

	test('sequenceEqual terminates when one of two infinite sources differs, and closes both', () => {
		const first = infiniteSource();
		const second = infiniteSource();
		expect(sequenceEqual(first.iterable, second.iterable, (a, b) => a < 3 && a === b)).toBe(false);
		expect(first.stats).toEqual({ reads: 4, closed: true });
		expect(second.stats).toEqual({ reads: 4, closed: true });
	});

	test('sequenceEqual terminates against a shorter source when the other is infinite', () => {
		const { stats, iterable } = infiniteSource();
		expect(sequenceEqual(iterable, [0, 1, 2])).toBe(false);
		expect(sequenceEqual([0, 1, 2], iterable)).toBe(false);
		expect(stats.closed).toBe(true);
	});

	test('sequenceEqual is action', () => {
		expectAction(source => sequenceEqual(source, [1, 2, 3, 4, 5]));
		expectAction(source => sequenceEqual([1, 2, 3, 4, 5], source));
	});

	test('sequenceEqual runs again on every call', () => {
		const values = range(3);
		expect(sequenceEqual(values, [0, 1, 2])).toBe(true);
		expect(sequenceEqual(values, [0, 1, 2])).toBe(true);
	});

	test('an equals error closes both sources and propagates unchanged', () => {
		const error = new Error('equals');
		const first = closableSource([1, 2, 3]);
		const second = closableSource([1, 2, 3]);
		expect(() => sequenceEqual(first.iterable, second.iterable, () => { throw error; })).toThrow(error);
		expect(first.state.closed).toBe(true);
		expect(second.state.closed).toBe(true);
	});

	test('an error of the iterable propagates unchanged, does not close it and closes other', () => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(2, error);
		const other = closableSource([1, 2, 3]);
		expect(() => sequenceEqual(iterable, other.iterable)).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
		expect(other.state.closed).toBe(true);
	});

	test('an error of other propagates unchanged, does not close it and closes the iterable', () => {
		const error = new Error('other');
		const { returnSpy, iterable } = throwingSource(2, error);
		const source = closableSource([1, 2, 3]);
		expect(() => sequenceEqual(source.iterable, iterable)).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
		expect(source.state.closed).toBe(true);
	});

	test('an error of other at its end propagates unchanged and does not close it', () => {
		const error = new Error('other');
		const { returnSpy, iterable } = throwingSource(3, error);
		expect(() => sequenceEqual([1, 2], iterable)).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	test('sequenceEqual types equals with the element type', () => {
		const result = sequenceEqual(['a'], ['b'], (a, b) => {
			expectTypeOf(a).toEqualTypeOf<string>();
			expectTypeOf(b).toEqualTypeOf<string>();
			return a.length === b.length;
		});
		expectTypeOf(result).toEqualTypeOf<boolean>();
		expect(result).toBe(true);
	});

});
