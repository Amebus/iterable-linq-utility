import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { expectAction } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('IterableLinq.indexOf', () => {

	test.each([
		{ start: 0, end: 0, value: 0, expectedResult: -1 },
		{ start: 0, end: 5, value: 4, expectedResult: 4 },
		{ start: 0, end: 5, value: 5, expectedResult: -1 },
		{ start: -3, end: 3, value: 0, expectedResult: 3 }
	])('IterableLinq.fromRange($start, $end).indexOf($value) -> $expectedResult', ({ start, end, value, expectedResult }) => {
		expect(IterableLinq.fromRange(start, end).indexOf(value)).toBe(expectedResult);
	});

	test('IterableLinq.indexOf uses strict equality', () => {
		expect(IterableLinq.from([1, NaN]).indexOf(NaN)).toBe(-1);
		expect(IterableLinq.from([-0]).indexOf(0)).toBe(0);
	});

	test('IterableLinq.indexOf counts the values of the chain, not of the source', () => {
		expect(IterableLinq.fromRange(0, 10).filter(v => v % 2 === 0).indexOf(6)).toBe(3);
	});

	test('IterableLinq.indexOf is action', () => {
		expectAction(source => IterableLinq.from(source).indexOf(2));
	});

	test('IterableLinq.indexOf terminates on an infinite chain that contains the value', () => {
		const { stats, iterable } = infiniteSource();
		expect(IterableLinq.from(iterable).indexOf(3)).toBe(3);
		expect(stats).toEqual({ reads: 4, closed: true });
	});

	test('IterableLinq.indexOf closes the source at the first match', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(IterableLinq.from(iterable).indexOf(2)).toBe(1);
		expect(state.closed).toBe(true);
	});

	test('IterableLinq.indexOf takes a value of the element type', () => {
		const chain = IterableLinq.from<number | string>([1, 'two']);
		expectTypeOf(chain.indexOf).parameter(0).toEqualTypeOf<number | string>();
		expect(chain.indexOf('two')).toBe(1);
	});

});
