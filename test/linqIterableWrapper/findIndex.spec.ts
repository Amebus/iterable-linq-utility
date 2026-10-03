import { describe, expect, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { expectAction } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';
import { withoutInputFunctionThrowsException } from './linqIterableWrapperTestUtility';

describe('IterableLinq.findIndex', () => {

	test('IterableLinq.findIndex without predicate -> throw exception', () => {
		withoutInputFunctionThrowsException(IterableLinq.fromRange(0, 20), 'findIndex');
	});

	test.each([
		{ start: 0, end: 0, expectedResult: -1 },
		{ start: 0, end: 5, expectedResult: -1 },
		{ start: 0, end: 8, expectedResult: 5 },
		{ start: 6, end: 8, expectedResult: 0 }
	])('IterableLinq.fromRange($start, $end).findIndex(v => v >= 5) -> $expectedResult', ({ start, end, expectedResult }) => {
		expect(IterableLinq.fromRange(start, end).findIndex(v => v >= 5)).toBe(expectedResult);
	});

	test('IterableLinq.findIndex counts the values of the chain, not of the source', () => {
		expect(IterableLinq.fromRange(0, 10).filter(v => v % 2 === 0).findIndex(v => v === 6)).toBe(3);
	});

	test('IterableLinq.findIndex passes the index and restarts it on every call', () => {
		const indexes: number[] = [];
		const chain = IterableLinq.from(['a', 'b', 'c']);
		const predicate = (_: string, index: number) => {
			indexes.push(index);
			return index === 1;
		};
		expect(chain.findIndex(predicate)).toBe(1);
		expect(chain.findIndex(predicate)).toBe(1);
		expect(indexes).toEqual([0, 1, 0, 1]);
	});

	test('IterableLinq.findIndex is action', () => {
		expectAction(source => IterableLinq.from(source).findIndex(v => v > 1));
	});

	test('IterableLinq.findIndex terminates on an infinite chain with a match', () => {
		const { stats, iterable } = infiniteSource();
		expect(IterableLinq.from(iterable).findIndex(v => v === 3)).toBe(3);
		expect(stats).toEqual({ reads: 4, closed: true });
	});

	test('IterableLinq.findIndex closes the source when the predicate throws', () => {
		const error = new Error('predicate');
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(() => IterableLinq.from(iterable).findIndex(() => { throw error; })).toThrow(error);
		expect(state.closed).toBe(true);
	});

});
