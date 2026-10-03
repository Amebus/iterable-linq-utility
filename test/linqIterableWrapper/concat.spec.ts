import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { expectTransformation } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('IterableLinq.concat', () => {

	test('IterableLinq.concat with an other value that is not iterable -> throw exception', () => {
		const chain = IterableLinq.from([1]) as any;
		expect(() => chain.concat([2], null)).toThrow('[iterable-linq-utility/concat] ');
	});

	test.each([
		{ end: 0, others: [], expectedResult: [] },
		{ end: 2, others: [], expectedResult: [0, 1] },
		{ end: 2, others: [[5], [], [6, 7]], expectedResult: [0, 1, 5, 6, 7] }
	])('IterableLinq.fromRange($end).concat(...$others) -> $expectedResult', ({ end, others, expectedResult }) => {
		expect(IterableLinq.fromRange(end).concat(...others).collectToArray()).toEqual(expectedResult);
	});

	test('IterableLinq.concat takes other chains', () => {
		const evens = IterableLinq.fromRange(10).filter(v => v % 2 === 0);
		expect(IterableLinq.from([-1]).concat(evens.take(2), evens.skip(4)).collectToArray()).toEqual([-1, 0, 2, 8]);
	});

	test('IterableLinq.concat composes with the other operations', () => {
		const r = IterableLinq
			.fromRange(5)
			.filter(v => v % 2 === 0)
			.concat([10])
			.map(v => v * 10)
			.collectToArray();
		expect(r).toEqual([0, 20, 40, 100]);
	});

	test('IterableLinq.concat is transformation', () => {
		expectTransformation(source => IterableLinq.from(source).concat([6]));
	});

	test('IterableLinq.concat closes the iterable being read when the chain stops early', () => {
		const { state, iterable } = closableSource([2, 3]);
		expect(IterableLinq.from([1]).concat(iterable).take(2).collectToArray()).toEqual([1, 2]);
		expect(state.closed).toBe(true);
	});

	test('IterableLinq.concat keeps the chain type', () => {
		const result = IterableLinq.from([1, 2]).concat([3], new Set([4]));
		expectTypeOf(result).toEqualTypeOf<IterableLinq.IIterableLinq<number>>();
	});

});
