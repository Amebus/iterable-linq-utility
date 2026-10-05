import { describe, expect, test } from 'vitest';
import { expectTransformation } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('IterableLinq.with', () => {

	test.each([2.5, NaN, Infinity, undefined, null])('IterableLinq.fromRange(10).with(%s, 0) -> throw exception', index => {
		const chain = IterableLinq.fromRange(10) as any;
		expect(() => chain.with(index, 0)).toThrow(Error);
	});

	test.each([
		{ index: 0, expectedResult: [-1, 1, 2] },
		{ index: 2, expectedResult: [0, 1, -1] },
		{ index: -1, expectedResult: [0, 1, -1] },
		{ index: -3, expectedResult: [-1, 1, 2] }
	])('IterableLinq.fromRange(3).with($index, -1) -> $expectedResult', ({ index, expectedResult }) => {
		expect(IterableLinq.fromRange(3).with(index, -1).collectToArray()).toEqual(expectedResult);
	});

	test.each([3, -4])('IterableLinq.fromRange(3).with(%i, -1) throws when the chain ends', index => {
		expect(() => IterableLinq.fromRange(3).with(index, -1).collectToArray()).toThrow(/out of range/);
	});

	test('IterableLinq.with composes with the other operations', () => {
		const r = IterableLinq
			.fromRange(10)
			.filter(v => v % 2 === 0)
			.with(-1, 100)
			.map(v => v / 2)
			.collectToArray();
		expect(r).toEqual([0, 1, 2, 3, 50]);
	});

	test('IterableLinq.with is transformation', () => {
		expectTransformation(source => IterableLinq.from(source).with(1, 0));
	});

});
