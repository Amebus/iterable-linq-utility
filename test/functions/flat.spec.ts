import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectTransformation } from '../_helpers/operationKind';

import {
	collectToArray,
	flat,
	range,
	take
} from '@/functions';
import type { FlatIterable } from '@/types';
import { returnClosesTheIterator, withoutInputIterableThrowsException } from './functionsTestUtility';

const nested = [1, [2, [3, [4, [5]]]], 6];

describe('flat', () => {

	test('flat without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(flat);
	});

	test.each([-1, 2.5, NaN, -Infinity, null, '2'])('flat(iterable, %s) -> throw exception', depth => {
		expect(() => flat([[1]], depth as any)).toThrow(new Error('[iterable-linq-utility/flat] The "depth" parameter must be a non-negative integer or Infinity'));
	});

	test.each([
		{ returnValue: 'a value' },
		{ returnValue: 123 },
		{ returnValue: null },
		{}
	])('flat(range(20))[Symbol.iterator]().return() closes the iterator', ({ returnValue }) => {
		returnClosesTheIterator(flat(range(20)), returnValue);
	});

	test.each([undefined, 0, 1, 2, 3, 4, 5, Infinity])('flat(nested, %s) yields the values of Array.prototype.flat', depth => {
		expect(collectToArray(flat(nested, depth))).toEqual(nested.flat(depth ?? 1));
	});

	test.each([
		{ values: [], expectedResult: [] },
		{ values: [[], [[]], []], expectedResult: [[]] },
		{ values: [1, 2], expectedResult: [1, 2] },
		{ values: [[1, 2], [3]], expectedResult: [1, 2, 3] }
	])('flat($values) -> $expectedResult', ({ values, expectedResult }) => {
		expect(collectToArray(flat<unknown>(values))).toEqual(expectedResult);
	});

	test('flat flattens any iterable', () => {
		const generated = { *[Symbol.iterator]() {
			yield 3;
			yield 4;
		} };
		const values: unknown[] = [new Set([1, 2]), generated, new Map([['a', 5]]), range(2)];
		expect(collectToArray(flat(values))).toEqual([1, 2, 3, 4, ['a', 5], 0, 1]);
		expect(collectToArray(flat(values, 2))).toEqual([1, 2, 3, 4, 'a', 5, 0, 1]);
	});

	test('flat does not flatten strings', () => {
		const object = new String('cd');
		expect(collectToArray(flat(['ab', [object, ['ef']]] as unknown[], Infinity))).toEqual(['ab', object, 'ef']);
		expect(collectToArray(flat('abc'))).toEqual(['a', 'b', 'c']);
	});

	test('flat yields null and undefined and objects that are not iterable', () => {
		const object = { length: 1, 0: 'x' };
		expect(collectToArray(flat<unknown>([null, [undefined], object]))).toEqual([null, undefined, object]);
	});

	test('flat(iterable, 0) yields the values as they are', () => {
		const inner = [1];
		expect(collectToArray(flat([inner], 0))[0]).toBe(inner);
	});

	test('nested arrays are read by index, without their iterator', () => {
		const inner = [1, 2];
		inner[Symbol.iterator] = () => { throw new Error('not called'); };
		expect(collectToArray(flat([inner]))).toEqual([1, 2]);
	});

	test('flat is transformation', () => {
		expectTransformation(source => flat(source));
		expectTransformation(source => flat(source, Infinity));
	});

	test('flat allows re-run', () => {
		const flattened = flat([[1], [2, [3]]]);
		expect(collectToArray(flattened)).toEqual([1, 2, [3]]);
		expect(collectToArray(flattened)).toEqual([1, 2, [3]]);
	});

	test('flat reads the nested iterables only as far as needed', () => {
		const inner = spyIterable([1, 2, 3]);
		const it = flat([inner])[Symbol.iterator]();
		expect(it.next().value).toBe(1);
		expect(inner.stats.reads).toBe(1);
	});

	test('flat works with an infinite source and an infinite nested iterable', () => {
		const source = infiniteSource();
		expect(collectToArray(take(flat(source.iterable), 3))).toEqual([0, 1, 2]);
		expect(source.stats.closed).toBe(true);
		const inner = infiniteSource();
		expect(collectToArray(take(flat([inner.iterable]), 2))).toEqual([0, 1]);
		expect(inner.stats.closed).toBe(true);
	});

	test('return() closes every open iterator and the source', () => {
		const outer = closableSource([1, 2]);
		const inner = closableSource([3, 4]);
		const source = { *[Symbol.iterator]() {
			yield [outer.iterable];
			yield inner.iterable;
		} };
		let closed = false;
		const wrapper = { *[Symbol.iterator]() {
			try {
				yield* source;
			} finally {
				closed = true;
			}
		} };
		const it = flat(wrapper as Iterable<unknown>, 2)[Symbol.iterator]();
		expect(it.next().value).toBe(1);
		it.return!();
		expect(outer.state.closed).toBe(true);
		expect(closed).toBe(true);
		expect(inner.state.closed).toBe(false);
	});

	test('a return() that throws does not leave the other iterators open', () => {
		const error = new Error('return');
		const failing = {
			[Symbol.iterator]: () => ({
				next: () => ({ done: false, value: 1 }),
				return: () => { throw error; }
			})
		};
		const { state, iterable } = closableSource([0]);
		const source = { *[Symbol.iterator]() {
			for (const value of iterable)
				yield [value, failing];
		} };
		const it = flat(source as Iterable<unknown>, 2)[Symbol.iterator]();
		expect([it.next().value, it.next().value]).toEqual([0, 1]);
		expect(() => it.return!()).toThrow(error);
		expect(state.closed).toBe(true);
	});

	test('an error of a nested iterable closes the source and the iterables that contain it', () => {
		const error = new Error('nested');
		const { returnSpy, iterable } = throwingSource(2, error);
		const outer = closableSource([9]);
		const source = closableSource([0]);
		const values = { *[Symbol.iterator]() {
			for (const value of source.iterable)
				yield [outer.iterable, [value, iterable]];
		} };
		expect(() => collectToArray(flat(values as Iterable<unknown>, Infinity))).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
		expect(source.state.closed).toBe(true);
	});

	test('an error of the iterator of a nested iterable closes the source', () => {
		const error = new Error('iterator');
		const { state, iterable } = closableSource([1, 2]);
		const values = { *[Symbol.iterator]() {
			for (const value of iterable)
				yield { [Symbol.iterator]: () => { throw error; }, value };
		} };
		expect(() => collectToArray(flat<unknown>(values))).toThrow(error);
		expect(state.closed).toBe(true);
	});

	test('an error of the source propagates, without closing the source', () => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(3, error);
		expect(() => collectToArray(flat(iterable))).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	test('iterator stays done', () => {
		const it = flat([[1], 2])[Symbol.iterator]();
		expect([it.next(), it.next()].map(r => r.value)).toEqual([1, 2]);
		for (let i = 0; i < 3; i++)
			expect(it.next().done).toBe(true);
	});

	test('the type of the values follows the depth', () => {
		expectTypeOf(flat([[1], [2]])).toEqualTypeOf<Iterable<number>>();
		expectTypeOf(flat([1, [2, [3]]])).toEqualTypeOf<Iterable<number | number[]>>();
		expectTypeOf(flat([1, [2, [3]]], 2)).toEqualTypeOf<Iterable<number>>();
		expectTypeOf(flat([new Set(['a']), 'bc'])).toEqualTypeOf<Iterable<string>>();
		expectTypeOf(flat([[1]], 0)).toEqualTypeOf<Iterable<number[]>>();
		expectTypeOf<FlatIterable<number[][][], 3>>().toEqualTypeOf<number>();
	});

});
