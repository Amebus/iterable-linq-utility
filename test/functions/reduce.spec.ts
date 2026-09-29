import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/closableSource';
import { expectAction } from '../_helpers/operationKind';

import {
	reduce,
	range
} from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

describe('reduce', () => {

	test('reduce without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(reduce);
	});

	test.each([
		{ start: 0, end: 20 },
		{ start: -10, end: 10 },
		{ start: 0, end: 20, reducer: undefined },
		{ start: 0, end: 20, reducer: null },
		{ start: 0, end: 20, reducer: {} }
	])('reduce without mapper -> throw exception', ({ start, end, reducer }) => {
		const reduceJs = reduce as any;
		expect(() => reduceJs(range(start, end))).toThrow();
		expect(() => reduceJs(range(start, end), reducer)).toThrow();
	});

	test.each([
		{ start: 0, end: 15, acc: 0, reducer: (acc, v) => acc + v, expectedResult: 105 },
		{ start: 0, end: 15, acc: 10, reducer: (acc, v) => acc + v, expectedResult: 115 },
		{ start: -14, end: 15, acc: 0, reducer: (acc, v) => acc + v, expectedResult: 0 },
		{ start: -14, end: 15, acc: 10, reducer: (acc, v) => acc + v, expectedResult: 10 },

		{ start: 1, end: 5, acc: 0, reducer: (acc, v) => acc * v, expectedResult: 0 },
		{ start: 1, end: 5, acc: 10, reducer: (acc, v) => acc * v, expectedResult: 240 },
		{ start: -5, end: 0, acc: 0, reducer: (acc, v) => acc * v, expectedResult: -0 },
		{ start: -5, end: 0, acc: 10, reducer: (acc, v) => acc * v, expectedResult: -1200 },

		{ start: 0, end: 15, acc: 0, reducer: (acc, _v, idx) => acc + idx, expectedResult: 105 },
		{ start: 0, end: 15, acc: 10, reducer: (acc, _v, idx) => acc + idx, expectedResult: 115 },
		{ start: 20, end: 15, acc: 0, reducer: (acc, _v, idx) => acc + idx, expectedResult: 10 },
		{ start: 20, end: 15, acc: 5, reducer: (acc, _v, idx) => acc + idx, expectedResult: 15 }
	])('reduce(range($start, $end), $acc, $reducer) -> $expectedResult', ({ start, end, acc, reducer, expectedResult }) => {
		const r = reduce(range(start, end), acc, reducer);
		expect(r).toBe(expectedResult);
	});

	test.each([
		{ iterable: 'ciao', acc: '', reducer: (acc, v) => acc + v, expectedResult: 'ciao' },
		{ iterable: 'ciao', acc: '', reducer: (acc, _v, idx) => acc + idx, expectedResult: '0123' }
	])('reduce($iterable, $acc, $reducer) -> $expectedResult', ({ iterable, acc, reducer, expectedResult }) => {
		const r = reduce(iterable, acc, reducer);
		expect(r).toBe(expectedResult);
	});

	test('reduce is action', () => {
		expectAction(source => reduce(source, 0, (acc, v) => acc + v));
	});

	test('a throwing reducer closes the source and propagates the error', () => {
		const err = new Error('boom');
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(() => reduce(iterable, 0, () => { throw err; })).toThrow(err);
		expect(state.closed).toBe(true);
	});

	describe('without a seed', () => {

		test.each([
			{ iterable: [1, 2, 3], reducer: (acc, v) => acc + v, expectedResult: 6 },
			{ iterable: [3, 7, 2], reducer: (acc, v) => (v > acc ? v : acc), expectedResult: 7 },
			{ iterable: 'ciao', reducer: (acc, v) => v + acc, expectedResult: 'oaic' }
		])('reduce($iterable, $reducer) -> $expectedResult', ({ iterable, reducer, expectedResult }) => {
			expect(reduce(iterable as Iterable<any>, reducer)).toBe(expectedResult);
		});

		test('the first value is the seed and the reducer starts at index 1', () => {
			const calls: [number, number, number][] = [];
			const r = reduce([10, 20, 30], (acc, v, index) => {
				calls.push([acc, v, index]);
				return acc + v;
			});
			expect(r).toBe(60);
			expect(calls).toEqual([[10, 20, 1], [30, 30, 2]]);
		});

		test('with one value returns it without calling the reducer', () => {
			let called = false;
			const r = reduce([42], (acc) => {
				called = true;
				return acc;
			});
			expect(r).toBe(42);
			expect(called).toBe(false);
		});

		test('an empty source throws', () => {
			expect(() => reduce([] as number[], (acc, v) => acc + v)).toThrow('must not be empty');
		});

		test.each([
			{ reducer: undefined },
			{ reducer: null },
			{ reducer: {} }
		])('reducer $reducer -> throw exception, also on an empty source', ({ reducer }) => {
			const reduceJs = reduce as any;
			expect(() => reduceJs([1, 2], reducer)).toThrow('"reducer"');
			expect(() => reduceJs([], reducer)).toThrow('"reducer"');
		});

		test('is action', () => {
			expectAction(source => reduce(source, (acc, v) => acc + v));
		});

		test('a throwing reducer closes the source and propagates the error', () => {
			const err = new Error('boom');
			const { state, iterable } = closableSource([1, 2, 3]);
			expect(() => reduce(iterable, () => { throw err; })).toThrow(err);
			expect(state.closed).toBe(true);
		});

	});

	describe('the number of arguments picks the form', () => {

		test('an undefined seed is a seed', () => {
			const r = reduce([1, 2], undefined as number | undefined, (acc, v) => (acc ?? 0) + v);
			expect(r).toBe(3);
			expect(reduce([] as number[], undefined, (acc) => acc)).toBeUndefined();
		});

		test('a function can be a seed', () => {
			const seed = (x: number) => x;
			const r = reduce([1, 2], seed, (acc) => acc);
			expect(r).toBe(seed);
		});

	});

	test('the return type follows the form', () => {
		expectTypeOf(reduce([1, 2], (acc, v) => acc + v)).toEqualTypeOf<number>();
		expectTypeOf(reduce([1, 2], '', (acc, v) => acc + v)).toEqualTypeOf<string>();
	});

});
