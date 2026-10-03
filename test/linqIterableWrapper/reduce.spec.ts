import { describe, expect, expectTypeOf, test } from 'vitest';
import { expectAction } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('reduce', () => {

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
	])('IterableLinq.fromRange($start, $end).reduce($acc, $reducer) -> $expectedResult', ({ start, end, acc, reducer, expectedResult }) => {
		const r = IterableLinq
			.fromRange(start, end)
			.reduce(acc, reducer);
		expect(r).toBe(expectedResult);
	});

	test.each([
		{ iterable: 'ciao', acc: '', reducer: (acc, v) => acc + v, expectedResult: 'ciao' },
		{ iterable: 'ciao', acc: '', reducer: (acc, _v, idx) => acc + idx, expectedResult: '0123' },
	])('IterableLinq.from.($iterable).reduce($acc, $reducer) -> $expectedResult', ({ iterable, acc, reducer, expectedResult }) => {
		const r = IterableLinq.from(iterable).reduce(acc, reducer);
		expect(r).toBe(expectedResult);
	});

	test('IterableLinq.reduce is action', () => {
		expectAction(source => IterableLinq.from(source).reduce(0, (acc, v) => acc + v));
	});

	describe('without a seed', () => {

		test.each([
			{ iterable: [1, 2, 3], reducer: (acc, v) => acc + v, expectedResult: 6 },
			{ iterable: [3, 7, 2], reducer: (acc, v) => (v > acc ? v : acc), expectedResult: 7 },
			{ iterable: [42], reducer: () => { throw new Error('not called'); }, expectedResult: 42 }
		])('IterableLinq.from($iterable).reduce($reducer) -> $expectedResult', ({ iterable, reducer, expectedResult }) => {
			expect(IterableLinq.from(iterable).reduce(reducer)).toBe(expectedResult);
		});

		test('the reducer starts at index 1', () => {
			const indexes: number[] = [];
			IterableLinq.from([10, 20, 30]).reduce((acc, v, index) => {
				indexes.push(index);
				return acc + v;
			});
			expect(indexes).toEqual([1, 2]);
		});

		test('an empty chain throws', () => {
			expect(() => IterableLinq.empty<number>().reduce((acc, v) => acc + v)).toThrow(new Error('[iterable-linq-utility/reduce] The "sourceIterable" must not be empty when "reduce" has no seed'));
		});

		test('an undefined seed is a seed', () => {
			expect(IterableLinq.empty<number>().reduce(undefined, (acc) => acc)).toBeUndefined();
		});

		test('IterableLinq.reduce is action', () => {
			expectAction(source => IterableLinq.from(source).reduce((acc, v) => acc + v));
		});

	});

	test('the return type follows the form', () => {
		expectTypeOf(IterableLinq.from([1, 2]).reduce((acc, v) => acc + v)).toEqualTypeOf<number>();
		expectTypeOf(IterableLinq.from([1, 2]).reduce('', (acc, v) => acc + v)).toEqualTypeOf<string>();
	});

});
