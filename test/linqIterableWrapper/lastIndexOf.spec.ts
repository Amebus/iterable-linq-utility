import { describe, expect, expectTypeOf, test } from 'vitest';
import { expectAction } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('IterableLinq.lastIndexOf', () => {

	test.each([
		{ values: [], value: 0, expectedResult: -1 },
		{ values: [1, 2, 1, 3], value: 1, expectedResult: 2 },
		{ values: [1, 2, 3], value: 4, expectedResult: -1 }
	])('IterableLinq.from($values).lastIndexOf($value) -> $expectedResult', ({ values, value, expectedResult }) => {
		expect(IterableLinq.from(values).lastIndexOf(value)).toBe(expectedResult);
	});

	test('IterableLinq.lastIndexOf uses strict equality', () => {
		expect(IterableLinq.from([NaN]).lastIndexOf(NaN)).toBe(-1);
		expect(IterableLinq.from([-0]).lastIndexOf(0)).toBe(0);
	});

	test('IterableLinq.lastIndexOf counts the values of the chain, not of the source', () => {
		expect(IterableLinq.from([6, 1, 6, 3, 6, 5]).filter(v => v % 2 === 0).lastIndexOf(6)).toBe(2);
	});

	test('IterableLinq.lastIndexOf is action', () => {
		expectAction(source => IterableLinq.from(source).lastIndexOf(2));
	});

	test('IterableLinq.lastIndexOf takes a value of the element type', () => {
		const chain = IterableLinq.from<number | string>([1, 'two']);
		expectTypeOf(chain.lastIndexOf).parameter(0).toEqualTypeOf<number | string>();
		expect(chain.lastIndexOf('two')).toBe(1);
	});

});
