import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { expectTransformation } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('IterableLinq.prepend', () => {

	test.each([
		{ end: 0, value: 9, expectedResult: [9] },
		{ end: 3, value: 9, expectedResult: [9, 0, 1, 2] }
	])('IterableLinq.fromRange($end).prepend($value) -> $expectedResult', ({ end, value, expectedResult }) => {
		expect(IterableLinq.fromRange(end).prepend(value).collectToArray()).toEqual(expectedResult);
	});

	test('IterableLinq.prepend composes with the other operations', () => {
		const r = IterableLinq
			.fromRange(5)
			.filter(v => v % 2 === 0)
			.prepend(10)
			.map(v => v * 10)
			.collectToArray();
		expect(r).toEqual([100, 0, 20, 40]);
	});

	test('IterableLinq.prepend is transformation', () => {
		expectTransformation(source => IterableLinq.from(source).prepend(0));
	});

	test('IterableLinq.prepend closes the source when the chain stops early', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(IterableLinq.from(iterable).prepend(9).take(2).collectToArray()).toEqual([9, 1]);
		expect(state.closed).toBe(true);
	});

	test('IterableLinq.prepend keeps the chain type', () => {
		const result = IterableLinq.from([1, 2]).prepend(3);
		expectTypeOf(result).toEqualTypeOf<IterableLinq.IIterableLinq<number>>();
	});

});
