import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { expectAction } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('IterableLinq.at', () => {

	test.each([1.5, NaN, Infinity, undefined, '1'])('IterableLinq.at(%s) -> throw exception', index => {
		expect(() => IterableLinq.from([1]).at(index as never)).toThrow('The "index" parameter must be an integer');
	});

	test.each([
		{ start: 0, end: 0, index: 0, expectedResult: undefined },
		{ start: 0, end: 5, index: 1, expectedResult: 1 },
		{ start: 0, end: 5, index: -1, expectedResult: 4 },
		{ start: 0, end: 5, index: 5, expectedResult: undefined },
		{ start: 0, end: 5, index: -6, expectedResult: undefined }
	])('IterableLinq.fromRange($start, $end).at($index) -> $expectedResult', ({ start, end, index, expectedResult }) => {
		expect(IterableLinq.fromRange(start, end).at(index)).toBe(expectedResult);
	});

	test('IterableLinq.at counts the values of the chain, not of the source', () => {
		const evens = IterableLinq.fromRange(0, 10).filter(v => v % 2 === 0);
		expect(evens.at(1)).toBe(2);
		expect(evens.at(-1)).toBe(8);
	});

	test('IterableLinq.at is action', () => {
		expectAction(source => IterableLinq.from(source).at(1));
		expectAction(source => IterableLinq.from(source).at(-1));
	});

	test('IterableLinq.at with a non-negative index terminates on an infinite chain', () => {
		const { stats, iterable } = infiniteSource();
		expect(IterableLinq.from(iterable).at(2)).toBe(2);
		expect(stats).toEqual({ reads: 3, closed: true });
	});

	test('IterableLinq.at closes the source after the value', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(IterableLinq.from(iterable).at(0)).toBe(1);
		expect(state.closed).toBe(true);
	});

	test('IterableLinq.at returns the element type or undefined', () => {
		const chain = IterableLinq.from<number | string>([1, 'two']);
		expectTypeOf(chain.at(0)).toEqualTypeOf<number | string | undefined>();
		expect(chain.at(-1)).toBe('two');
	});

});
