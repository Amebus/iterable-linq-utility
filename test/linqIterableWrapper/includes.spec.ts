import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { expectAction } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('IterableLinq.includes', () => {

	test.each([
		{ start: 0, end: 0, value: 0, expectedResult: false },
		{ start: 0, end: 5, value: 4, expectedResult: true },
		{ start: 0, end: 5, value: 5, expectedResult: false },
		{ start: -3, end: 3, value: -3, expectedResult: true }
	])('IterableLinq.fromRange($start, $end).includes($value) -> $expectedResult', ({ start, end, value, expectedResult }) => {
		expect(IterableLinq.fromRange(start, end).includes(value)).toBe(expectedResult);
	});

	test('IterableLinq.includes uses SameValueZero', () => {
		expect(IterableLinq.from([1, NaN]).includes(NaN)).toBe(true);
		expect(IterableLinq.from([-0]).includes(0)).toBe(true);
	});

	test('IterableLinq.includes looks at the values of the chain', () => {
		const evens = IterableLinq.fromRange(0, 10).filter(v => v % 2 === 0);
		expect(evens.includes(4)).toBe(true);
		expect(evens.includes(5)).toBe(false);
	});

	test('IterableLinq.includes is action', () => {
		expectAction(source => IterableLinq.from(source).includes(2));
	});

	test('IterableLinq.includes terminates on an infinite chain that contains the value', () => {
		const { stats, iterable } = infiniteSource();
		expect(IterableLinq.from(iterable).includes(3)).toBe(true);
		expect(stats).toEqual({ reads: 4, closed: true });
	});

	test('IterableLinq.includes closes the source at the first match', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(IterableLinq.from(iterable).includes(2)).toBe(true);
		expect(state.closed).toBe(true);
	});

	test('IterableLinq.includes takes a value of the element type', () => {
		const chain = IterableLinq.from<number | string>([1, 'two']);
		expectTypeOf(chain.includes).parameter(0).toEqualTypeOf<number | string>();
		expect(chain.includes('two')).toBe(true);
	});

});
