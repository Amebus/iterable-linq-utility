import { describe, expect, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { expectAction } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('IterableLinq.count', () => {

	test.each([null, 0, {}])('IterableLinq.count rejects invalid predicate %s', predicate => {
		expect(() => IterableLinq.from([1]).count(predicate as never)).toThrow(new Error('[iterable-linq-utility/count] The "predicate" function must be provided'));
	});

	test.each([
		{ start: 0, end: 0, expectedResult: 0 },
		{ start: 0, end: 5, expectedResult: 5 },
		{ start: -3, end: 3, expectedResult: 6 }
	])('IterableLinq.fromRange($start, $end).count() -> $expectedResult', ({ start, end, expectedResult }) => {
		expect(IterableLinq.fromRange(start, end).count()).toBe(expectedResult);
		expect(IterableLinq.fromRange(start, end).count(undefined)).toBe(expectedResult);
	});

	test.each([
		{ start: 0, end: 0, expectedResult: 0 },
		{ start: 0, end: 5, expectedResult: 0 },
		{ start: 0, end: 8, expectedResult: 3 }
	])('IterableLinq.fromRange($start, $end).count(v => v >= 5) -> $expectedResult', ({ start, end, expectedResult }) => {
		expect(IterableLinq.fromRange(start, end).count(v => v >= 5)).toBe(expectedResult);
	});

	test('IterableLinq.count counts the values of the chain', () => {
		expect(IterableLinq.fromRange(0, 10).filter(v => v % 2 === 0).count()).toBe(5);
	});

	test('IterableLinq.count passes the index and restarts it on every call', () => {
		const indexes: number[] = [];
		const chain = IterableLinq.from(['a', 'b']);
		const predicate = (_: string, index: number) => {
			indexes.push(index);
			return true;
		};
		expect(chain.count(predicate)).toBe(2);
		expect(chain.count(predicate)).toBe(2);
		expect(indexes).toEqual([0, 1, 0, 1]);
	});

	test('IterableLinq.count is action', () => {
		expectAction(source => IterableLinq.from(source).count());
		expectAction(source => IterableLinq.from(source).count(v => v > 1));
	});

	test('IterableLinq.count closes the source when the predicate throws', () => {
		const error = new Error('predicate');
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(() => IterableLinq.from(iterable).count(() => { throw error; })).toThrow(error);
		expect(state.closed).toBe(true);
	});

});
