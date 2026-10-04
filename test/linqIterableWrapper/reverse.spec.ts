import { describe, expect, test } from 'vitest';
import { expectTransformation } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('IterableLinq.reverse', () => {

	test.each([
		{ end: 0, expectedResult: [] },
		{ end: 1, expectedResult: [0] },
		{ end: 5, expectedResult: [4, 3, 2, 1, 0] }
	])('IterableLinq.fromRange($end).reverse() -> $expectedResult', ({ end, expectedResult }) => {
		expect(IterableLinq.fromRange(end).reverse().collectToArray()).toEqual(expectedResult);
	});

	test('IterableLinq.reverse composes with the other operations', () => {
		const r = IterableLinq
			.fromRange(10)
			.filter(v => v % 2 === 0)
			.reverse()
			.take(3)
			.map(v => v * 10)
			.collectToArray();
		expect(r).toEqual([80, 60, 40]);
	});

	test('IterableLinq.reverse is transformation', () => {
		expectTransformation(source => IterableLinq.from(source).reverse());
	});

});
