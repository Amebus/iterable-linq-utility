import { describe, expect, test } from 'vitest';
import { expectTransformation } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('IterableLinq.defaultIfEmpty', () => {

	test.each([
		{ end: 0, expectedResult: [-1] },
		{ end: 3, expectedResult: [0, 1, 2] }
	])('IterableLinq.fromRange($end).defaultIfEmpty(-1) -> $expectedResult', ({ end, expectedResult }) => {
		expect(IterableLinq.fromRange(end).defaultIfEmpty(-1).collectToArray()).toEqual(expectedResult);
	});

	test('IterableLinq.defaultIfEmpty composes with the other operations', () => {
		const r = IterableLinq
			.fromRange(10)
			.filter(v => v > 100)
			.defaultIfEmpty(0)
			.map(v => v + 1)
			.collectToArray();
		expect(r).toEqual([1]);
	});

	test('IterableLinq.defaultIfEmpty is transformation', () => {
		expectTransformation(source => IterableLinq.from(source).defaultIfEmpty(0));
	});

});
