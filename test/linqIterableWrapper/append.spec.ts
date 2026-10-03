import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { expectTransformation } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('IterableLinq.append', () => {

	test.each([
		{ end: 0, value: 9, expectedResult: [9] },
		{ end: 3, value: 9, expectedResult: [0, 1, 2, 9] }
	])('IterableLinq.fromRange($end).append($value) -> $expectedResult', ({ end, value, expectedResult }) => {
		expect(IterableLinq.fromRange(end).append(value).collectToArray()).toEqual(expectedResult);
	});

	test('IterableLinq.append composes with the other operations', () => {
		const r = IterableLinq
			.fromRange(5)
			.filter(v => v % 2 === 0)
			.append(10)
			.map(v => v * 10)
			.collectToArray();
		expect(r).toEqual([0, 20, 40, 100]);
	});

	test('IterableLinq.append is transformation', () => {
		expectTransformation(source => IterableLinq.from(source).append(6));
	});

	test('IterableLinq.append closes the source when the chain stops early', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(IterableLinq.from(iterable).append(9).take(1).collectToArray()).toEqual([1]);
		expect(state.closed).toBe(true);
	});

	test('IterableLinq.append keeps the chain type', () => {
		const result = IterableLinq.from([1, 2]).append(3);
		expectTypeOf(result).toEqualTypeOf<IterableLinq.IIterableLinq<number>>();
	});

});
