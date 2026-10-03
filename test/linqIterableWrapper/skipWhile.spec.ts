import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { expectTransformation } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';
import { withoutInputFunctionThrowsException } from './linqIterableWrapperTestUtility';

describe('IterableLinq.skipWhile', () => {

	test('IterableLinq.skipWhile without predicate -> throw exception', () => {
		withoutInputFunctionThrowsException(IterableLinq.fromRange(0, 20), 'skipWhile');
	});

	test.each([
		{ start: 0, end: 0, expectedResult: [] },
		{ start: 0, end: 8, expectedResult: [5, 6, 7] },
		{ start: 5, end: 8, expectedResult: [5, 6, 7] },
		{ start: 0, end: 5, expectedResult: [] }
	])('IterableLinq.fromRange($start, $end).skipWhile(v => v < 5) -> $expectedResult', ({ start, end, expectedResult }) => {
		expect(IterableLinq.fromRange(start, end).skipWhile(v => v < 5).collectToArray()).toEqual(expectedResult);
	});

	test('IterableLinq.skipWhile passes the index until the first rejected value and allows re-run', () => {
		const indexes: number[] = [];
		const result = IterableLinq.from(['a', 'b', 'c']).skipWhile((_, index) => {
			indexes.push(index);
			return index < 1;
		});
		expect(indexes).toEqual([]);
		expect(result.collectToArray()).toEqual(['b', 'c']);
		expect(result.collectToArray()).toEqual(['b', 'c']);
		expect(indexes).toEqual([0, 1, 0, 1]);
	});

	test('IterableLinq.skipWhile is transformation', () => {
		expectTransformation(source => IterableLinq.from(source).skipWhile(v => v < 2));
	});

	test('IterableLinq.skipWhile works on an infinite chain combined with take', () => {
		const { stats, iterable } = infiniteSource();
		expect(IterableLinq.from(iterable).skipWhile(v => v < 3).take(2).collectToArray()).toEqual([3, 4]);
		expect(stats).toEqual({ reads: 5, closed: true });
	});

	test('IterableLinq.skipWhile closes the source when the predicate throws', () => {
		const error = new Error('predicate');
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(() => IterableLinq.from(iterable).skipWhile(() => { throw error; }).collectToArray()).toThrow(error);
		expect(state.closed).toBe(true);
	});

	test('IterableLinq.skipWhile preserves the chain type', () => {
		const values: (number | string)[] = [1, 'two', 3];
		const result = IterableLinq.from(values).skipWhile(value => typeof value === 'number');
		expectTypeOf(result).toEqualTypeOf<IterableLinq.IIterableLinq<number | string>>();
		expect(result.collectToArray()).toEqual(['two', 3]);
	});

});
