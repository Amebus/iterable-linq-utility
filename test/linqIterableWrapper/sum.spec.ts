import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { expectAction } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('IterableLinq.sum', () => {

	test.each([null, 0, {}])('IterableLinq.sum rejects invalid selector %s', selector => {
		expect(() => IterableLinq.from([1]).sum(selector as never)).toThrow(new Error('[iterable-linq-utility/sum] The "selector" function must be provided'));
	});

	test.each([
		{ start: 0, end: 0, expectedResult: 0 },
		{ start: 0, end: 5, expectedResult: 10 },
		{ start: -3, end: 3, expectedResult: -3 }
	])('IterableLinq.fromRange($start, $end).sum() -> $expectedResult', ({ start, end, expectedResult }) => {
		expect(IterableLinq.fromRange(start, end).sum()).toBe(expectedResult);
	});

	test('IterableLinq.sum sums the selected numbers', () => {
		expect(IterableLinq.from(['a', 'bb', 'ccc']).sum(v => v.length)).toBe(6);
		expect(IterableLinq.from([1, 2]).sum(undefined)).toBe(3);
	});

	test('IterableLinq.sum sums the values of the chain', () => {
		expect(IterableLinq.fromRange(0, 10).filter(v => v % 2 === 0).sum()).toBe(20);
	});

	test('IterableLinq.sum passes the index and restarts it on every call', () => {
		const indexes: number[] = [];
		const chain = IterableLinq.from(['a', 'b']);
		const selector = (_: string, index: number) => {
			indexes.push(index);
			return index;
		};
		expect(chain.sum(selector)).toBe(1);
		expect(chain.sum(selector)).toBe(1);
		expect(indexes).toEqual([0, 1, 0, 1]);
	});

	test('IterableLinq.sum is action', () => {
		expectAction(source => IterableLinq.from(source).sum());
		expectAction(source => IterableLinq.from(source).sum(v => v * 2));
	});

	test('IterableLinq.sum closes the source when the selector throws', () => {
		const error = new Error('selector');
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(() => IterableLinq.from(iterable).sum(() => { throw error; })).toThrow(error);
		expect(state.closed).toBe(true);
	});

	test('IterableLinq.sum needs a selector on a chain of non-numbers', () => {
		const chain = IterableLinq.from(['a', 'bb']);
		// @ts-expect-error without a selector the chain must contain numbers
		expect(chain.sum()).toBe('0abb');
		expectTypeOf(chain.sum(v => v.length)).toEqualTypeOf<number>();
	});

});
