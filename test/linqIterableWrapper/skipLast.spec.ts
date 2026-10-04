import { describe, expect, test } from 'vitest';
import { expectTransformation } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('IterableLinq.skipLast', () => {

	test.each([-1, 2.5, NaN, Infinity, undefined, null])('IterableLinq.fromRange(10).skipLast(%s) -> throw exception', count => {
		const chain = IterableLinq.fromRange(10) as any;
		expect(() => chain.skipLast(count)).toThrow(Error);
	});

	test.each([
		{ end: 0, count: 3, expectedResult: [] },
		{ end: 5, count: 0, expectedResult: [0, 1, 2, 3, 4] },
		{ end: 5, count: 3, expectedResult: [0, 1] },
		{ end: 5, count: 10, expectedResult: [] }
	])('IterableLinq.fromRange($end).skipLast($count) -> $expectedResult', ({ end, count, expectedResult }) => {
		expect(IterableLinq.fromRange(end).skipLast(count).collectToArray()).toEqual(expectedResult);
	});

	test('IterableLinq.skipLast composes with the other operations', () => {
		const r = IterableLinq
			.fromRange(10)
			.filter(v => v % 2 === 0)
			.skipLast(2)
			.map(v => v * 10)
			.collectToArray();
		expect(r).toEqual([0, 20, 40]);
	});

	test('IterableLinq.skipLast is transformation', () => {
		expectTransformation(source => IterableLinq.from(source).skipLast(3));
	});

});
