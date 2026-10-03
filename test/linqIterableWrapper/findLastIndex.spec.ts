import { describe, expect, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { expectAction } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';
import { withoutInputFunctionThrowsException } from './linqIterableWrapperTestUtility';

describe('IterableLinq.findLastIndex', () => {

	test('IterableLinq.findLastIndex without predicate -> throw exception', () => {
		withoutInputFunctionThrowsException(IterableLinq.fromRange(0, 20), 'findLastIndex');
	});

	test.each([
		{ start: 0, end: 0, expectedResult: -1 },
		{ start: 0, end: 8, expectedResult: 4 },
		{ start: 5, end: 8, expectedResult: -1 }
	])('IterableLinq.fromRange($start, $end).findLastIndex(v => v < 5) -> $expectedResult', ({ start, end, expectedResult }) => {
		expect(IterableLinq.fromRange(start, end).findLastIndex(v => v < 5)).toBe(expectedResult);
	});

	test('IterableLinq.findLastIndex counts the values of the chain, not of the source', () => {
		expect(IterableLinq.from([6, 1, 6, 3, 6, 5]).filter(v => v % 2 === 0).findLastIndex(v => v === 6)).toBe(2);
	});

	test('IterableLinq.findLastIndex passes the index and restarts it on every call', () => {
		const indexes: number[] = [];
		const chain = IterableLinq.from(['a', 'b', 'c']);
		const predicate = (_: string, index: number) => {
			indexes.push(index);
			return index < 2;
		};
		expect(chain.findLastIndex(predicate)).toBe(1);
		expect(chain.findLastIndex(predicate)).toBe(1);
		expect(indexes).toEqual([0, 1, 2, 0, 1, 2]);
	});

	test('IterableLinq.findLastIndex is action', () => {
		expectAction(source => IterableLinq.from(source).findLastIndex(v => v > 1));
	});

	test('IterableLinq.findLastIndex closes the source when the predicate throws', () => {
		const error = new Error('predicate');
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(() => IterableLinq.from(iterable).findLastIndex(() => { throw error; })).toThrow(error);
		expect(state.closed).toBe(true);
	});

});
