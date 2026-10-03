import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { expectAction } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('IterableLinq.average', () => {

	test.each([null, 0, {}])('IterableLinq.average rejects invalid selector %s', selector => {
		expect(() => IterableLinq.from([1]).average(selector as never)).toThrow(new Error('[iterable-linq-utility/average] The "selector" function must be provided'));
	});

	test.each([
		{ start: 0, end: 0, expectedResult: undefined },
		{ start: 0, end: 5, expectedResult: 2 },
		{ start: -3, end: 3, expectedResult: -0.5 }
	])('IterableLinq.fromRange($start, $end).average() -> $expectedResult', ({ start, end, expectedResult }) => {
		expect(IterableLinq.fromRange(start, end).average()).toBe(expectedResult);
	});

	test('IterableLinq.average averages the selected numbers', () => {
		expect(IterableLinq.from(['a', 'bb', 'ccc']).average(v => v.length)).toBe(2);
		expect(IterableLinq.from([1, 2]).average(undefined)).toBe(1.5);
	});

	test('IterableLinq.average averages the values of the chain', () => {
		expect(IterableLinq.fromRange(0, 10).filter(v => v % 2 === 0).average()).toBe(4);
	});

	test('IterableLinq.average passes the index and restarts it on every call', () => {
		const indexes: number[] = [];
		const chain = IterableLinq.from(['a', 'b']);
		const selector = (_: string, index: number) => {
			indexes.push(index);
			return index;
		};
		expect(chain.average(selector)).toBe(0.5);
		expect(chain.average(selector)).toBe(0.5);
		expect(indexes).toEqual([0, 1, 0, 1]);
	});

	test('IterableLinq.average is action', () => {
		expectAction(source => IterableLinq.from(source).average());
		expectAction(source => IterableLinq.from(source).average(v => v * 2));
	});

	test('IterableLinq.average closes the source when the selector throws', () => {
		const error = new Error('selector');
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(() => IterableLinq.from(iterable).average(() => { throw error; })).toThrow(error);
		expect(state.closed).toBe(true);
	});

	test('IterableLinq.average needs a selector on a chain of non-numbers', () => {
		const chain = IterableLinq.from(['a', 'bb']);
		// @ts-expect-error without a selector the chain must contain numbers
		expect(chain.average()).toBe(Number.NaN);
		expectTypeOf(chain.average(v => v.length)).toEqualTypeOf<number | undefined>();
	});

});
