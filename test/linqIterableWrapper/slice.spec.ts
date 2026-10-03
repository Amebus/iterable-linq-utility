import { describe, expect, expectTypeOf, test } from 'vitest';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { expectTransformation } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('IterableLinq.slice', () => {

	test.each([2.5, NaN, Infinity, null])('IterableLinq.fromRange(10).slice(%s) -> throw exception', start => {
		const chain = IterableLinq.fromRange(10) as any;
		expect(() => chain.slice(start)).toThrow('[iterable-linq-utility/slice] ');
		expect(() => chain.slice(0, start)).toThrow('[iterable-linq-utility/slice] ');
	});

	test.each([
		{ start: undefined, end: undefined, expectedResult: [0, 1, 2, 3, 4] },
		{ start: 1, end: 3, expectedResult: [1, 2] },
		{ start: 1, end: -1, expectedResult: [1, 2, 3] },
		{ start: -2, end: undefined, expectedResult: [3, 4] },
		{ start: -4, end: -1, expectedResult: [1, 2, 3] },
		{ start: -4, end: 2, expectedResult: [1] },
		{ start: 3, end: 1, expectedResult: [] }
	])('IterableLinq.fromRange(5).slice($start, $end) -> $expectedResult', ({ start, end, expectedResult }) => {
		expect(IterableLinq.fromRange(5).slice(start, end).collectToArray()).toEqual(expectedResult);
	});

	test('IterableLinq.slice composes with the other operations', () => {
		const r = IterableLinq
			.fromRange(10)
			.filter(v => v % 2 === 0)
			.slice(1, -1)
			.map(v => v * 10)
			.collectToArray();
		expect(r).toEqual([20, 40, 60]);
	});

	test('IterableLinq.slice works on an infinite chain with non-negative indexes', () => {
		const { stats, iterable } = infiniteSource();
		expect(IterableLinq.from(iterable).slice(2, 4).collectToArray()).toEqual([2, 3]);
		expect(stats).toEqual({ reads: 4, closed: true });
	});

	test('IterableLinq.slice is transformation', () => {
		expectTransformation(source => IterableLinq.from(source).slice(-3, -1));
	});

	test('IterableLinq.slice keeps the chain type', () => {
		const result = IterableLinq.from([1, 2]).slice(1);
		expectTypeOf(result).toEqualTypeOf<IterableLinq.IIterableLinq<number>>();
	});

});
