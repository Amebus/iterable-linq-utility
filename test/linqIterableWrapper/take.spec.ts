import { describe, expect, test } from 'vitest';
import { expectTransformation } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('IterableLinq.take', () => {

	test.each([-1, 2.5, NaN, Infinity, undefined, null])('IterableLinq.fromRange(10).take(%s) -> throw exception', count => {
		const chain = IterableLinq.fromRange(10) as any;
		expect(() => chain.take(count)).toThrow(Error);
	});

	test.each([
		{ end: 0, count: 3, expectedResult: [] },
		{ end: 5, count: 0, expectedResult: [] },
		{ end: 5, count: 3, expectedResult: [0, 1, 2] },
		{ end: 5, count: 10, expectedResult: [0, 1, 2, 3, 4] }
	])('IterableLinq.fromRange($end).take($count) -> $expectedResult', ({ end, count, expectedResult }) => {
		expect(IterableLinq.fromRange(end).take(count).collectToArray()).toEqual(expectedResult);
	});

	test('IterableLinq.take composes with the other operations', () => {
		const r = IterableLinq
			.fromRange(100)
			.filter(v => v % 2 === 0)
			.take(3)
			.map(v => v * 10)
			.collectToArray();
		expect(r).toEqual([0, 20, 40]);
	});

	test('IterableLinq.take is transformation', () => {
		expectTransformation(source => IterableLinq.from(source).take(3));
	});

});
