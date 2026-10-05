import { describe, expect, expectTypeOf, test } from 'vitest';
import { expectTransformation } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('IterableLinq.flat', () => {

	test.each([-1, 2.5, NaN, null])('IterableLinq.from([[1]]).flat(%s) -> throw exception', depth => {
		const chain = IterableLinq.from([[1]]) as any;
		expect(() => chain.flat(depth)).toThrow(Error);
	});

	test.each([
		{ depth: undefined, expectedResult: [1, 2, [3, [4]]] },
		{ depth: 0, expectedResult: [1, [2, [3, [4]]]] },
		{ depth: Infinity, expectedResult: [1, 2, 3, 4] }
	])('IterableLinq.from([1, [2, [3, [4]]]]).flat($depth) -> $expectedResult', ({ depth, expectedResult }) => {
		expect(IterableLinq.from<unknown>([1, [2, [3, [4]]]]).flat(depth).collectToArray()).toEqual(expectedResult);
	});

	test('IterableLinq.flat composes with the other operations', () => {
		const r = IterableLinq
			.fromRange(3)
			.map(v => [v, [v * 10]])
			.flat(2)
			.filter(v => v > 0)
			.collectToArray();
		expect(r).toEqual([1, 10, 2, 20]);
	});

	test('IterableLinq.flat flattens chains', () => {
		const r = IterableLinq.from([IterableLinq.fromRange(2), IterableLinq.from(['a'])]).flat().collectToArray();
		expect(r).toEqual([0, 1, 'a']);
	});

	test('IterableLinq.flat is transformation', () => {
		expectTransformation(source => IterableLinq.from(source).flat());
	});

	test('the type of the values follows the depth', () => {
		expectTypeOf(IterableLinq.from([[1], [2]]).flat().collectToArray()).toEqualTypeOf<number[]>();
		expectTypeOf(IterableLinq.from([[[1]]]).flat(2).collectToArray()).toEqualTypeOf<number[]>();
	});

});
