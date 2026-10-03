import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectAction } from '../_helpers/operationKind';

import {
	findIndex,
	range
} from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

describe('findIndex', () => {

	test('findIndex without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(findIndex);
	});

	test.each([undefined, null, false, 0, 'predicate', {}])('findIndex(iterable, %j) -> throw exception without reading the source', predicate => {
		const source = spyIterable([1, 2]);
		expect(() => findIndex(source, predicate as never)).toThrow('The "predicate" function must be provided');
		expect(source.stats).toEqual({ iterations: 0, reads: 0 });
	});

	test.each([
		{ values: [], expectedResult: -1 },
		{ values: [1, 2, 3], expectedResult: -1 },
		{ values: [5], expectedResult: 0 },
		{ values: [1, 5, 6], expectedResult: 1 },
		{ values: [1, 2, 3, 7], expectedResult: 3 }
	])('findIndex($values, v => v > 4) -> $expectedResult', ({ values, expectedResult }) => {
		expect(findIndex(values, v => v > 4)).toBe(expectedResult);
	});

	test('findIndex finds an undefined value', () => {
		expect(findIndex([1, undefined, 3], v => v === undefined)).toBe(1);
	});

	test('findIndex works on a string', () => {
		expect(findIndex('banana', v => v === 'n')).toBe(2);
	});

	test('findIndex passes each value and its index, and stops at the first match', () => {
		const calls: [string, number][] = [];
		expect(findIndex(['a', 'b', 'c', 'd'], (value, index) => {
			calls.push([value, index]);
			return value === 'c';
		})).toBe(2);
		expect(calls).toEqual([['a', 0], ['b', 1], ['c', 2]]);
	});

	test('findIndex does not read past the first match', () => {
		const source = spyIterable([1, 2, 5, 3, 6]);
		expect(findIndex(source, v => v > 4)).toBe(2);
		expect(source.stats.reads).toBe(3);
	});

	test('findIndex reads the whole source when nothing matches', () => {
		const source = spyIterable([1, 2, 3]);
		expect(findIndex(source, v => v > 4)).toBe(-1);
		expect(source.stats.reads).toBe(3);
	});

	test('findIndex terminates on an infinite source with a match', () => {
		const { stats, iterable } = infiniteSource();
		expect(findIndex(iterable, v => v === 3)).toBe(3);
		expect(stats).toEqual({ reads: 4, closed: true });
	});

	test('findIndex is action', () => {
		expectAction(source => findIndex(source, v => v > 1));
	});

	test('findIndex runs again on every call', () => {
		const values = range(5, 10);
		expect(findIndex(values, v => v > 6)).toBe(2);
		expect(findIndex(values, v => v > 6)).toBe(2);
	});

	test('the first match closes the source', () => {
		const { state, iterable } = closableSource([1, 5, 3]);
		expect(findIndex(iterable, v => v > 4)).toBe(1);
		expect(state.closed).toBe(true);
	});

	test('a predicate error closes the source and propagates unchanged', () => {
		const error = new Error('predicate');
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(() => findIndex(iterable, () => { throw error; })).toThrow(error);
		expect(state.closed).toBe(true);
	});

	test('a source error propagates unchanged and does not close the source', () => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(2, error);
		expect(() => findIndex(iterable, () => false)).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	test('findIndex infers the predicate arguments', () => {
		const values: (number | string)[] = [1, 'two'];
		const result = findIndex(values, (value, index) => {
			expectTypeOf(value).toEqualTypeOf<number | string>();
			expectTypeOf(index).toEqualTypeOf<number>();
			return typeof value === 'string';
		});
		expectTypeOf(result).toEqualTypeOf<number>();
		expect(result).toBe(1);
	});

});
