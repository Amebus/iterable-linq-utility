import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { expectAction } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('IterableLinq.sequenceEqual', () => {

	test.each([undefined, null])('IterableLinq.sequenceEqual rejects a missing other %s', other => {
		expect(() => IterableLinq.from([1]).sequenceEqual(other as never)).toThrow(new Error('[iterable-linq-utility/sequenceEqual] The "sourceIterable" must be provided'));
	});

	test.each([null, 0, {}])('IterableLinq.sequenceEqual rejects invalid equals %s', equals => {
		expect(() => IterableLinq.from([1]).sequenceEqual([1], equals as never)).toThrow(new Error('[iterable-linq-utility/sequenceEqual] The "equals" function must be provided'));
	});

	test.each([
		{ start: 0, end: 0, other: [], expectedResult: true },
		{ start: 0, end: 3, other: [0, 1, 2], expectedResult: true },
		{ start: 0, end: 3, other: [0, 1], expectedResult: false },
		{ start: 0, end: 3, other: [0, 1, 2, 3], expectedResult: false },
		{ start: 0, end: 3, other: [0, 5, 2], expectedResult: false }
	])('IterableLinq.fromRange($start, $end).sequenceEqual($other) -> $expectedResult', ({ start, end, other, expectedResult }) => {
		expect(IterableLinq.fromRange(start, end).sequenceEqual(other)).toBe(expectedResult);
		expect(IterableLinq.fromRange(start, end).sequenceEqual(other, undefined)).toBe(expectedResult);
	});

	test('IterableLinq.sequenceEqual compares with another chain and with equals', () => {
		expect(IterableLinq.fromRange(0, 4).filter(v => v % 2 === 0).sequenceEqual(IterableLinq.from([0, 2]))).toBe(true);
		expect(IterableLinq.from(['a', 'bb']).sequenceEqual(['x', 'yy'], (a, b) => a.length === b.length)).toBe(true);
	});

	test('IterableLinq.sequenceEqual is action', () => {
		expectAction(source => IterableLinq.from(source).sequenceEqual([1, 2, 3, 4, 5]));
	});

	test('IterableLinq.sequenceEqual closes both sources when equals throws', () => {
		const error = new Error('equals');
		const first = closableSource([1, 2, 3]);
		const second = closableSource([1, 2, 3]);
		expect(() => IterableLinq.from(first.iterable).sequenceEqual(second.iterable, () => { throw error; })).toThrow(error);
		expect(first.state.closed).toBe(true);
		expect(second.state.closed).toBe(true);
	});

	test('IterableLinq.sequenceEqual types other and equals with the element type', () => {
		const chain = IterableLinq.from([1, 2]);
		// @ts-expect-error other must contain the element type
		expect(chain.sequenceEqual(['1', '2'])).toBe(false);
		expectTypeOf(chain.sequenceEqual([1, 2], (a, b) => {
			expectTypeOf(a).toEqualTypeOf<number>();
			expectTypeOf(b).toEqualTypeOf<number>();
			return a === b;
		})).toEqualTypeOf<boolean>();
	});

});
