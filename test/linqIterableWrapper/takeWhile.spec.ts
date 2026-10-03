import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { expectTransformation } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';
import { withoutInputFunctionThrowsException } from './linqIterableWrapperTestUtility';

describe('IterableLinq.takeWhile', () => {

	test('IterableLinq.takeWhile without predicate -> throw exception', () => {
		withoutInputFunctionThrowsException(IterableLinq.fromRange(0, 20), 'takeWhile');
	});

	test.each([
		{ start: 0, end: 0, expectedResult: [] },
		{ start: 0, end: 20, expectedResult: [0, 1, 2, 3, 4] },
		{ start: 5, end: 20, expectedResult: [] },
		{ start: -3, end: 3, expectedResult: [-3, -2, -1, 0, 1, 2] }
	])('IterableLinq.fromRange($start, $end).takeWhile(v => v < 5) -> $expectedResult', ({ start, end, expectedResult }) => {
		expect(IterableLinq.fromRange(start, end).takeWhile(v => v < 5).collectToArray()).toEqual(expectedResult);
	});

	test('IterableLinq.takeWhile passes the index and allows re-run', () => {
		const indexes: number[] = [];
		const result = IterableLinq.from(['a', 'b', 'c']).takeWhile((_, index) => {
			indexes.push(index);
			return index < 1;
		});
		expect(indexes).toEqual([]);
		expect(result.collectToArray()).toEqual(['a']);
		expect(result.collectToArray()).toEqual(['a']);
		expect(indexes).toEqual([0, 1, 0, 1]);
	});

	test('IterableLinq.takeWhile is transformation', () => {
		expectTransformation(source => IterableLinq.from(source).takeWhile(v => v < 2));
	});

	test('IterableLinq.takeWhile ends an infinite chain', () => {
		const { stats, iterable } = infiniteSource();
		expect(IterableLinq.from(iterable).takeWhile(v => v < 3).collectToArray()).toEqual([0, 1, 2]);
		expect(stats).toEqual({ reads: 4, closed: true });
	});

	test('IterableLinq.takeWhile closes the source when the predicate throws', () => {
		const error = new Error('predicate');
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(() => IterableLinq.from(iterable).takeWhile(() => { throw error; }).collectToArray()).toThrow(error);
		expect(state.closed).toBe(true);
	});

	test('a type guard narrows the chain for map', () => {
		const values: (number | string)[] = [1, 2, 'three', 4];
		const result = IterableLinq.from(values).takeWhile((value): value is number => typeof value === 'number');
		expectTypeOf(result).toEqualTypeOf<IterableLinq.IIterableLinq<number>>();
		const doubled = result.map(value => value * 2).collectToArray();
		expectTypeOf(doubled).toEqualTypeOf<number[]>();
		expect(doubled).toEqual([2, 4]);
	});

	test('a boolean predicate preserves the chain type', () => {
		const values: (number | string)[] = [1, 'two'];
		const result = IterableLinq.from(values).takeWhile((value): boolean => value !== 'three');
		expectTypeOf(result).toEqualTypeOf<IterableLinq.IIterableLinq<number | string>>();
		expect(result.collectToArray()).toEqual([1, 'two']);
	});

});
