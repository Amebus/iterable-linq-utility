import { describe, expect, expectTypeOf, test } from 'vitest';
import { expectTransformation } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('IterableLinq.zip', () => {

	test.each([undefined, null, 1, {}])('IterableLinq.fromRange(3).zip(%s) -> throw exception', other => {
		const chain = IterableLinq.fromRange(3) as any;
		expect(() => chain.zip(other)).toThrow(Error);
	});

	test.each([
		{ end: 0, expectedResult: [] },
		{ end: 2, expectedResult: [[0, 'a'], [1, 'b']] },
		{ end: 5, expectedResult: [[0, 'a'], [1, 'b'], [2, 'c']] }
	])('IterableLinq.fromRange($end).zip(\'abc\') -> $expectedResult', ({ end, expectedResult }) => {
		expect(IterableLinq.fromRange(end).zip('abc').collectToArray()).toEqual(expectedResult);
	});

	test('IterableLinq.zip reads several iterables', () => {
		const r = IterableLinq.from([1, 2]).zip(['a', 'b'], IterableLinq.from([true, false])).collectToArray();
		expect(r).toEqual([[1, 'a', true], [2, 'b', false]]);
	});

	test('IterableLinq.zip composes with the other operations', () => {
		const r = IterableLinq
			.fromRange(5)
			.zip(IterableLinq.fromRange(5).map(v => v * 10))
			.map(([a, b]) => a + b)
			.filter(v => v > 20)
			.collectToArray();
		expect(r).toEqual([22, 33, 44]);
	});

	test('IterableLinq.zip is transformation', () => {
		expectTransformation(source => IterableLinq.from(source).zip([1, 2, 3, 4, 5]));
	});

	test('the values are tuples of the types of the iterables', () => {
		expectTypeOf(IterableLinq.from([1]).zip(['a']).collectToArray()).toEqualTypeOf<[number, string][]>();
		expectTypeOf(IterableLinq.from([1]).zip(['a'], [true]).collectToArray()).toEqualTypeOf<[number, string, boolean][]>();
	});

});
