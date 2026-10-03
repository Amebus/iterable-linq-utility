import { describe, expect, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { expectAction } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';
import { withoutInputFunctionThrowsException } from './linqIterableWrapperTestUtility';

describe('IterableLinq.every', () => {

	test('IterableLinq.every without predicate -> throw exception', () => {
		withoutInputFunctionThrowsException(IterableLinq.fromRange(0, 20), 'every');
	});

	test.each([
		{ start: 0, end: 0, expectedResult: true },
		{ start: 0, end: 5, expectedResult: true },
		{ start: 0, end: 8, expectedResult: false },
		{ start: 5, end: 8, expectedResult: false }
	])('IterableLinq.fromRange($start, $end).every(v => v < 5) -> $expectedResult', ({ start, end, expectedResult }) => {
		expect(IterableLinq.fromRange(start, end).every(v => v < 5)).toBe(expectedResult);
	});

	test('IterableLinq.every passes the index and restarts it on every call', () => {
		const indexes: number[] = [];
		const chain = IterableLinq.from(['a', 'b', 'c']);
		const predicate = (_: string, index: number) => {
			indexes.push(index);
			return index < 1;
		};
		expect(chain.every(predicate)).toBe(false);
		expect(chain.every(predicate)).toBe(false);
		expect(indexes).toEqual([0, 1, 0, 1]);
	});

	test('IterableLinq.every is action', () => {
		expectAction(source => IterableLinq.from(source).every(v => v < 2));
	});

	test('IterableLinq.every terminates on an infinite chain with a rejected value', () => {
		const { stats, iterable } = infiniteSource();
		expect(IterableLinq.from(iterable).every(v => v < 3)).toBe(false);
		expect(stats).toEqual({ reads: 4, closed: true });
	});

	test('IterableLinq.every closes the source when the predicate throws', () => {
		const error = new Error('predicate');
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(() => IterableLinq.from(iterable).every(() => { throw error; })).toThrow(error);
		expect(state.closed).toBe(true);
	});

});
