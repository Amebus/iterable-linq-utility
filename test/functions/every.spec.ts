import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectAction } from '../_helpers/operationKind';

import {
	every,
	range
} from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

describe('every', () => {

	test('every without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(every);
	});

	test.each([undefined, null, false, 0, 'predicate', {}])('every(iterable, %j) -> throw exception without reading the source', predicate => {
		const source = spyIterable([1, 2]);
		expect(() => every(source, predicate as never)).toThrow(new Error('[iterable-linq-utility/every] The "predicate" function must be provided'));
		expect(source.stats).toEqual({ iterations: 0, reads: 0 });
	});

	test.each([
		{ values: [], expectedResult: true },
		{ values: [1, 2, 3], expectedResult: true },
		{ values: [5], expectedResult: false },
		{ values: [1, 2, 5, 3], expectedResult: false },
		{ values: [1, 2, 3, 5], expectedResult: false }
	])('every($values, v => v < 4) -> $expectedResult', ({ values, expectedResult }) => {
		expect(every(values, v => v < 4)).toBe(expectedResult);
	});

	test('every works on a string', () => {
		expect(every('aaa', v => v === 'a')).toBe(true);
		expect(every('aab', v => v === 'a')).toBe(false);
	});

	test('every passes each value and its index, and stops at the first rejected value', () => {
		const calls: [string, number][] = [];
		expect(every(['a', 'b', 'c', 'd'], (value, index) => {
			calls.push([value, index]);
			return index < 2;
		})).toBe(false);
		expect(calls).toEqual([['a', 0], ['b', 1], ['c', 2]]);
	});

	test('every does not read past the first rejected value', () => {
		const source = spyIterable([1, 2, 5, 3, 4]);
		expect(every(source, v => v < 4)).toBe(false);
		expect(source.stats.reads).toBe(3);
	});

	test('every reads the whole source when every value is accepted', () => {
		const source = spyIterable([1, 2, 3]);
		expect(every(source, v => v < 4)).toBe(true);
		expect(source.stats.reads).toBe(3);
	});

	test('every terminates on an infinite source with a rejected value', () => {
		const { stats, iterable } = infiniteSource();
		expect(every(iterable, v => v < 3)).toBe(false);
		expect(stats).toEqual({ reads: 4, closed: true });
	});

	test('every is action', () => {
		expectAction(source => every(source, v => v < 2));
	});

	test('every runs again on every call', () => {
		const values = range(5);
		expect(every(values, v => v < 5)).toBe(true);
		expect(every(values, v => v < 5)).toBe(true);
	});

	test('the first rejected value closes the source', () => {
		const { state, iterable } = closableSource([1, 5, 3]);
		expect(every(iterable, v => v < 4)).toBe(false);
		expect(state.closed).toBe(true);
	});

	test('a predicate error closes the source and propagates unchanged', () => {
		const error = new Error('predicate');
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(() => every(iterable, () => { throw error; })).toThrow(error);
		expect(state.closed).toBe(true);
	});

	test('a source error propagates unchanged and does not close the source', () => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(2, error);
		expect(() => every(iterable, () => true)).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	test('every infers the predicate arguments', () => {
		const values: (number | string)[] = [1, 'two'];
		const result = every(values, (value, index) => {
			expectTypeOf(value).toEqualTypeOf<number | string>();
			expectTypeOf(index).toEqualTypeOf<number>();
			return true;
		});
		expectTypeOf(result).toEqualTypeOf<boolean>();
		expect(result).toBe(true);
	});

});
