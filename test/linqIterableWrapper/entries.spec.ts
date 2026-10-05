import { describe, expect, expectTypeOf, test } from 'vitest';
import { expectTransformation } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('IterableLinq.entries', () => {

	test.each([
		{ end: 0, expectedResult: [] },
		{ end: 3, expectedResult: [[0, 0], [1, 1], [2, 2]] }
	])('IterableLinq.fromRange($end).entries() -> $expectedResult', ({ end, expectedResult }) => {
		expect(IterableLinq.fromRange(end).entries().collectToArray()).toEqual(expectedResult);
	});

	test('IterableLinq.entries composes with the other operations', () => {
		const r = IterableLinq
			.from(['a', 'b', 'c', 'd'])
			.filter(v => v !== 'b')
			.entries()
			.map(([index, v]) => `${index}${v}`)
			.collectToArray();
		expect(r).toEqual(['0a', '1c', '2d']);
	});

	test('IterableLinq.entries is transformation', () => {
		expectTransformation(source => IterableLinq.from(source).entries());
	});

	test('the values of the chain are index-value tuples', () => {
		expectTypeOf(IterableLinq.from(['a']).entries().collectToArray()).toEqualTypeOf<[number, string][]>();
	});

});
