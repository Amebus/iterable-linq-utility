import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectAction } from '../_helpers/operationKind';

import {
	range,
	reduceRight
} from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

describe('reduceRight', () => {

	test('reduceRight without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(reduceRight);
	});

	test.each([undefined, null, {}])('reduceRight(range(5), 0, %s) -> throw exception, also on an empty source', reducer => {
		const reduceRightJs = reduceRight as any;
		expect(() => reduceRightJs(range(5), 0, reducer)).toThrow(new Error('[iterable-linq-utility/reduceRight] The "reducer" function must be provided'));
		expect(() => reduceRightJs([], 0, reducer)).toThrow(new Error('[iterable-linq-utility/reduceRight] The "reducer" function must be provided'));
	});

	test.each([
		{ iterable: [1, 2, 3], seed: '', expectedResult: '321' },
		{ iterable: 'ciao', seed: '>', expectedResult: '>oaic' },
		{ iterable: [], seed: 'seed', expectedResult: 'seed' }
	])('reduceRight($iterable, $seed, concat) -> $expectedResult', ({ iterable, seed, expectedResult }) => {
		expect(reduceRight<unknown, string>(iterable, seed, (acc, v) => acc + String(v))).toBe(expectedResult);
	});

	test('the results match Array.prototype.reduceRight', () => {
		const values = [5, 1, 4, 2, 3];
		const reducer = (acc: number, v: number, index: number) => acc * 3 - v + index;
		expect(reduceRight(values, 7, reducer)).toBe(values.reduceRight(reducer, 7));
		expect(reduceRight(values, reducer)).toBe(values.reduceRight(reducer));
	});

	test('the reducer receives the values from the last one, with their index in the source', () => {
		const calls: [string, string, number][] = [];
		const r = reduceRight(['a', 'b', 'c'], '', (acc, v, index) => {
			calls.push([acc, v, index]);
			return acc + v;
		});
		expect(r).toBe('cba');
		expect(calls).toEqual([['', 'c', 2], ['c', 'b', 1], ['cb', 'a', 0]]);
	});

	test('reduceRight reads the whole source before calling the reducer', () => {
		const source = spyIterable([1, 2, 3]);
		const reads: number[] = [];
		reduceRight(source, 0, (acc, v) => {
			reads.push(source.stats.reads);
			return acc + v;
		});
		expect(reads).toEqual([3, 3, 3]);
	});

	test('reduceRight is action', () => {
		expectAction(source => reduceRight(source, 0, (acc, v) => acc + v));
	});

	test('a throwing reducer propagates the error', () => {
		const err = new Error('boom');
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(() => reduceRight(iterable, 0, () => { throw err; })).toThrow(err);
		expect(state.closed).toBe(true);
	});

	test('an error of the source propagates, without closing the source', () => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(3, error);
		expect(() => reduceRight(iterable, 0, (acc, v) => acc + v)).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	describe('without a seed', () => {

		test.each([
			{ iterable: [1, 2, 3], reducer: (acc, v) => acc + v, expectedResult: 6 },
			{ iterable: [3, 7, 2], reducer: (acc, v) => (v > acc ? v : acc), expectedResult: 7 },
			{ iterable: 'ciao', reducer: (acc, v) => acc + v, expectedResult: 'oaic' }
		])('reduceRight($iterable, $reducer) -> $expectedResult', ({ iterable, reducer, expectedResult }) => {
			expect(reduceRight(iterable as Iterable<any>, reducer)).toBe(expectedResult);
		});

		test('the last value is the seed and the reducer starts at the index of the second-to-last value', () => {
			const calls: [number, number, number][] = [];
			const r = reduceRight([10, 20, 30], (acc, v, index) => {
				calls.push([acc, v, index]);
				return acc + v;
			});
			expect(r).toBe(60);
			expect(calls).toEqual([[30, 20, 1], [50, 10, 0]]);
		});

		test('with one value returns it without calling the reducer', () => {
			let called = false;
			const r = reduceRight([42], (acc) => {
				called = true;
				return acc;
			});
			expect(r).toBe(42);
			expect(called).toBe(false);
		});

		test('an empty source throws', () => {
			expect(() => reduceRight([] as number[], (acc, v) => acc + v)).toThrow(new Error('[iterable-linq-utility/reduceRight] The "sourceIterable" must not be empty when "reduceRight" has no seed'));
		});

		test.each([
			{ reducer: undefined },
			{ reducer: null },
			{ reducer: {} }
		])('reducer $reducer -> throw exception, also on an empty source', ({ reducer }) => {
			const reduceRightJs = reduceRight as any;
			expect(() => reduceRightJs([1, 2], reducer)).toThrow(new Error('[iterable-linq-utility/reduceRight] The "reducer" function must be provided'));
			expect(() => reduceRightJs([], reducer)).toThrow(new Error('[iterable-linq-utility/reduceRight] The "reducer" function must be provided'));
		});

		test('is action', () => {
			expectAction(source => reduceRight(source, (acc, v) => acc + v));
		});

	});

	describe('the number of arguments picks the form', () => {

		test('an undefined seed is a seed', () => {
			const r = reduceRight([1, 2], undefined as number | undefined, (acc, v) => (acc ?? 0) + v);
			expect(r).toBe(3);
			expect(reduceRight([] as number[], undefined, (acc) => acc)).toBeUndefined();
		});

		test('a function can be a seed', () => {
			const seed = (x: number) => x;
			expect(reduceRight([1, 2], seed, (acc) => acc)).toBe(seed);
		});

	});

	test('the return type follows the form', () => {
		expectTypeOf(reduceRight([1, 2], (acc, v) => acc + v)).toEqualTypeOf<number>();
		expectTypeOf(reduceRight([1, 2], '', (acc, v) => acc + v)).toEqualTypeOf<string>();
	});

});
