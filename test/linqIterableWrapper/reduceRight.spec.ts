import { describe, expect, expectTypeOf, test } from 'vitest';
import { expectAction } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('IterableLinq.reduceRight', () => {

	test.each([
		{ end: 0, expectedResult: '' },
		{ end: 4, expectedResult: '3210' }
	])('IterableLinq.fromRange($end).reduceRight(\'\', concat) -> $expectedResult', ({ end, expectedResult }) => {
		expect(IterableLinq.fromRange(end).reduceRight('', (acc, v) => acc + v)).toBe(expectedResult);
	});

	test('IterableLinq.reduceRight passes the index of each value in the chain', () => {
		const indexes: number[] = [];
		IterableLinq.from(['a', 'b', 'c']).reduceRight('', (acc, v, index) => {
			indexes.push(index);
			return acc + v;
		});
		expect(indexes).toEqual([2, 1, 0]);
	});

	test('IterableLinq.reduceRight is action', () => {
		expectAction(source => IterableLinq.from(source).reduceRight(0, (acc, v) => acc + v));
	});

	describe('without a seed', () => {

		test.each([
			{ iterable: [1, 2, 3], reducer: (acc, v) => acc * 10 + v, expectedResult: 321 },
			{ iterable: [42], reducer: () => { throw new Error('not called'); }, expectedResult: 42 }
		])('IterableLinq.from($iterable).reduceRight($reducer) -> $expectedResult', ({ iterable, reducer, expectedResult }) => {
			expect(IterableLinq.from(iterable).reduceRight(reducer)).toBe(expectedResult);
		});

		test('an empty chain throws', () => {
			expect(() => IterableLinq.empty<number>().reduceRight((acc, v) => acc + v)).toThrow(Error);
		});

		test('is action', () => {
			expectAction(source => IterableLinq.from(source).reduceRight((acc, v) => acc + v));
		});

	});

	test('an undefined seed is a seed', () => {
		expect(IterableLinq.empty<number>().reduceRight(undefined, (acc) => acc)).toBeUndefined();
	});

	test('the return type follows the form', () => {
		expectTypeOf(IterableLinq.from([1, 2]).reduceRight((acc, v) => acc + v)).toEqualTypeOf<number>();
		expectTypeOf(IterableLinq.from([1, 2]).reduceRight('', (acc, v) => acc + v)).toEqualTypeOf<string>();
	});

});
