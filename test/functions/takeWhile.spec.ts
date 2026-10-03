import { describe, expect, expectTypeOf, test, vi } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectTransformation } from '../_helpers/operationKind';

import {
	collectToArray,
	map,
	range,
	takeWhile
} from '@/functions';
import { returnClosesTheIterator, withoutInputIterableThrowsException } from './functionsTestUtility';

describe('takeWhile', () => {

	test('takeWhile without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(takeWhile);
	});

	test.each([undefined, null, false, 0, 'predicate', {}])('takeWhile(iterable, %j) -> throw exception without reading the source', predicate => {
		const source = spyIterable([1, 2]);
		expect(() => takeWhile(source, predicate as never)).toThrow(new Error('[iterable-linq-utility/takeWhile] The "predicate" function must be provided'));
		expect(source.stats).toEqual({ iterations: 0, reads: 0 });
	});

	test.each([
		{ end: 20, returnValue: 'a value' },
		{ end: 20, returnValue: 123 },
		{ end: 20, returnValue: null },
		{ end: 20 }
	])('takeWhile(range($end), v => v < 10)[Symbol.iterator]().return() closes the iterator', ({ end, returnValue }) => {
		returnClosesTheIterator(takeWhile(range(end), v => v < 10), returnValue);
	});

	test.each([
		{ values: [], expectedResult: [] },
		{ values: [5, 1, 2], expectedResult: [] },
		{ values: [1, 2, 3], expectedResult: [1, 2, 3] },
		{ values: [1, 2, 5, 3, 1], expectedResult: [1, 2] },
		{ values: [4, 1, 2], expectedResult: [] }
	])('takeWhile($values, v => v < 4) -> $expectedResult', ({ values, expectedResult }) => {
		expect(collectToArray(takeWhile(values, v => v < 4))).toEqual(expectedResult);
	});

	test('takeWhile passes each value and its index to the predicate', () => {
		const calls: [string, number][] = [];
		const result = takeWhile(['a', 'b', 'c', 'd'], (value, index) => {
			calls.push([value, index]);
			return index < 2;
		});
		expect(collectToArray(result)).toEqual(['a', 'b']);
		expect(calls).toEqual([['a', 0], ['b', 1], ['c', 2]]);
	});

	test('takeWhile is transformation', () => {
		expectTransformation(source => takeWhile(source, v => v < 2));
	});

	test('takeWhile allows re-run and restarts the index', () => {
		const indexes: number[] = [];
		const taken = takeWhile(range(10), (v, index) => {
			indexes.push(index);
			return v < 3;
		});
		expect(collectToArray(taken)).toEqual([0, 1, 2]);
		expect(collectToArray(taken)).toEqual([0, 1, 2]);
		expect(indexes).toEqual([0, 1, 2, 3, 0, 1, 2, 3]);
	});

	test('takeWhile does not read past the first rejected value', () => {
		const source = spyIterable([1, 2, 5, 3, 4]);
		expect(collectToArray(takeWhile(source, v => v < 4))).toEqual([1, 2]);
		expect(source.stats.reads).toBe(3);
	});

	test('takeWhile ends an infinite source', () => {
		const { stats, iterable } = infiniteSource();
		expect(collectToArray(takeWhile(iterable, v => v < 4))).toEqual([0, 1, 2, 3]);
		expect(stats).toEqual({ reads: 5, closed: true });
	});

	test('the first rejected value closes the source', () => {
		const { state, iterable } = closableSource([1, 2, 5, 3]);
		const it = takeWhile(iterable, v => v < 4)[Symbol.iterator]();
		it.next();
		it.next();
		expect(state.closed).toBe(false);
		expect(it.next().done).toBe(true);
		expect(state.closed).toBe(true);
	});

	test('the end of the source does not close it', () => {
		const returnSpy = vi.fn();
		const next = vi.fn().mockReturnValueOnce({ done: false, value: 1 }).mockReturnValue({ done: true, value: undefined });
		const it = takeWhile({ [Symbol.iterator]: () => ({ next, return: returnSpy }) }, () => true)[Symbol.iterator]();
		expect(it.next()).toEqual({ done: false, value: 1 });
		expect(it.next().done).toBe(true);
		it.return!();
		expect(returnSpy).not.toHaveBeenCalled();
	});

	test('the first rejected value closes the source once', () => {
		const { returnSpy, iterable } = throwingSource(100, new Error('unused'));
		const it = takeWhile(iterable, v => v < 3)[Symbol.iterator]();
		expect([it.next(), it.next()].map(r => r.value)).toEqual([1, 2]);
		expect(it.next().done).toBe(true);
		it.return!();
		expect(returnSpy).toHaveBeenCalledOnce();
	});

	test('return() closes the source', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		const it = takeWhile(iterable, () => true)[Symbol.iterator]();
		it.next();
		it.return!();
		expect(state.closed).toBe(true);
	});

	test('a predicate error closes the source and propagates unchanged', () => {
		const error = new Error('predicate');
		const { state, iterable } = closableSource([1, 2, 3]);
		const it = takeWhile(iterable, v => {
			if (v === 2)
				throw error;
			return true;
		})[Symbol.iterator]();
		expect(it.next().value).toBe(1);
		expect(() => it.next()).toThrow(error);
		expect(state.closed).toBe(true);
		expect(it.next().done).toBe(true);
	});

	test('a source error propagates unchanged and does not close the source', () => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(2, error);
		const it = takeWhile(iterable, () => true)[Symbol.iterator]();
		expect(it.next().value).toBe(1);
		expect(() => it.next()).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	test('iterator stays done', () => {
		const it = takeWhile([1, 2, 5, 3], v => v < 4)[Symbol.iterator]();
		expect([it.next(), it.next()].map(r => r.value)).toEqual([1, 2]);
		for (let i = 0; i < 3; i++)
			expect(it.next().done).toBe(true);
	});

	test('a type guard narrows the element type', () => {
		const values: (number | string)[] = [1, 2, 'three', 4];
		const result = takeWhile(values, (value): value is number => typeof value === 'number');
		expectTypeOf(result).toEqualTypeOf<Iterable<number>>();
		expect(collectToArray(map(result, value => value * 10))).toEqual([10, 20]);
	});

	test('a boolean predicate preserves the element type and infers its arguments', () => {
		const values: (number | string)[] = [1, 'two'];
		const result = takeWhile(values, (value, index) => {
			expectTypeOf(value).toEqualTypeOf<number | string>();
			expectTypeOf(index).toEqualTypeOf<number>();
			return true;
		});
		expectTypeOf(result).toEqualTypeOf<Iterable<number | string>>();
		expect(collectToArray(result)).toEqual([1, 'two']);
	});

});
