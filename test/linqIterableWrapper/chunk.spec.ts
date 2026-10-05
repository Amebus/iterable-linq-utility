import { describe, expect, expectTypeOf, test } from 'vitest';
import { expectTransformation } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('IterableLinq.chunk', () => {

	test.each([0, -1, 2.5, NaN, Infinity, undefined, null])('IterableLinq.fromRange(10).chunk(%s) -> throw exception', size => {
		const chain = IterableLinq.fromRange(10) as any;
		expect(() => chain.chunk(size)).toThrow(Error);
	});

	test.each([
		{ end: 0, size: 2, expectedResult: [] },
		{ end: 5, size: 2, expectedResult: [[0, 1], [2, 3], [4]] },
		{ end: 4, size: 4, expectedResult: [[0, 1, 2, 3]] }
	])('IterableLinq.fromRange($end).chunk($size) -> $expectedResult', ({ end, size, expectedResult }) => {
		expect(IterableLinq.fromRange(end).chunk(size).collectToArray()).toEqual(expectedResult);
	});

	test('IterableLinq.chunk composes with the other operations', () => {
		const r = IterableLinq
			.fromRange(10)
			.filter(v => v % 2 === 0)
			.chunk(2)
			.map(values => values.reduce((a, b) => a + b, 0))
			.collectToArray();
		expect(r).toEqual([2, 10, 8]);
	});

	test('IterableLinq.chunk is transformation', () => {
		expectTransformation(source => IterableLinq.from(source).chunk(2));
	});

	test('the values of the chain are arrays', () => {
		expectTypeOf(IterableLinq.from(['a']).chunk(2).collectToArray()).toEqualTypeOf<string[][]>();
	});

});
