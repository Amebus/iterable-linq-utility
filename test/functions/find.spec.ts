import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectAction } from '../_helpers/operationKind';

import {
	find,
	range
} from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

describe('find', () => {

	test('find without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(find);
	});

	test.each([undefined, null, false, 0, 'predicate', {}])('find(iterable, %j) -> throw exception without reading the source', predicate => {
		const source = spyIterable([1, 2]);
		expect(() => find(source, predicate as never)).toThrow('The "predicate" function must be provided');
		expect(source.stats).toEqual({ iterations: 0, reads: 0 });
	});

	test.each([
		{ values: [], expectedResult: undefined },
		{ values: [1, 2, 3], expectedResult: undefined },
		{ values: [5], expectedResult: 5 },
		{ values: [1, 5, 6], expectedResult: 5 },
		{ values: [1, 2, 3, 7], expectedResult: 7 }
	])('find($values, v => v > 4) -> $expectedResult', ({ values, expectedResult }) => {
		expect(find(values, v => v > 4)).toBe(expectedResult);
	});

	test('find returns the found value itself', () => {
		const first = { id: 1 };
		const second = { id: 2 };
		expect(find([first, second], v => v.id === 2)).toBe(second);
	});

	test('find returns undefined for an accepted undefined value, as for no match', () => {
		const values = [1, undefined, 3];
		expect(find(values, v => v === undefined)).toBeUndefined();
		expect(find(values, v => v === 4)).toBeUndefined();
	});

	test('find works on a string', () => {
		expect(find('banana', v => v !== 'b')).toBe('a');
	});

	test('find passes each value and its index, and stops at the first match', () => {
		const calls: [string, number][] = [];
		expect(find(['a', 'b', 'c', 'd'], (value, index) => {
			calls.push([value, index]);
			return index === 2;
		})).toBe('c');
		expect(calls).toEqual([['a', 0], ['b', 1], ['c', 2]]);
	});

	test('find does not read past the first match', () => {
		const source = spyIterable([1, 2, 5, 3, 6]);
		expect(find(source, v => v > 4)).toBe(5);
		expect(source.stats.reads).toBe(3);
	});

	test('find reads the whole source when nothing matches', () => {
		const source = spyIterable([1, 2, 3]);
		expect(find(source, v => v > 4)).toBeUndefined();
		expect(source.stats.reads).toBe(3);
	});

	test('find terminates on an infinite source with a match', () => {
		const { stats, iterable } = infiniteSource();
		expect(find(iterable, v => v === 3)).toBe(3);
		expect(stats).toEqual({ reads: 4, closed: true });
	});

	test('find is action', () => {
		expectAction(source => find(source, v => v > 1));
	});

	test('find runs again on every call', () => {
		const values = range(5);
		expect(find(values, v => v > 2)).toBe(3);
		expect(find(values, v => v > 2)).toBe(3);
	});

	test('the first match closes the source', () => {
		const { state, iterable } = closableSource([1, 5, 3]);
		expect(find(iterable, v => v > 4)).toBe(5);
		expect(state.closed).toBe(true);
	});

	test('a predicate error closes the source and propagates unchanged', () => {
		const error = new Error('predicate');
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(() => find(iterable, () => { throw error; })).toThrow(error);
		expect(state.closed).toBe(true);
	});

	test('a source error propagates unchanged and does not close the source', () => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(2, error);
		expect(() => find(iterable, () => false)).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	test('a type guard narrows the result', () => {
		const values: (number | string)[] = [1, 'two', 3];
		const result = find(values, (value): value is string => typeof value === 'string');
		expectTypeOf(result).toEqualTypeOf<string | undefined>();
		expect(result).toBe('two');
	});

	test('a boolean predicate keeps the element type and infers its arguments', () => {
		const values: (number | string)[] = [1, 'two'];
		const result = find(values, (value, index) => {
			expectTypeOf(value).toEqualTypeOf<number | string>();
			expectTypeOf(index).toEqualTypeOf<number>();
			return index === 1;
		});
		expectTypeOf(result).toEqualTypeOf<number | string | undefined>();
		expect(result).toBe('two');
	});

});
