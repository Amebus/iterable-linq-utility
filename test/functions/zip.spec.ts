import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectTransformation } from '../_helpers/operationKind';

import {
	collectToArray,
	range,
	take,
	zip
} from '@/functions';
import { returnClosesTheIterator, withoutInputIterableThrowsException } from './functionsTestUtility';

describe('zip', () => {

	test('zip without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(zip);
	});

	test.each([undefined, null, 1, {}])('zip(range(3), %s) -> throw exception', other => {
		expect(() => zip(range(3), other as any)).toThrow(/^\[iterable-linq-utility\/zip\] /);
		expect(() => zip(range(3), [1], other as any)).toThrow(/^\[iterable-linq-utility\/zip\] /);
	});

	test.each([
		{ returnValue: 'a value' },
		{ returnValue: 123 },
		{ returnValue: null },
		{}
	])('zip(range(20), range(20))[Symbol.iterator]().return() closes the iterator', ({ returnValue }) => {
		returnClosesTheIterator(zip(range(20), range(20)), returnValue);
	});

	test.each([
		{ a: [], b: [], expectedResult: [] },
		{ a: [1, 2], b: [], expectedResult: [] },
		{ a: [1, 2], b: ['a', 'b'], expectedResult: [[1, 'a'], [2, 'b']] },
		{ a: [1, 2, 3], b: ['a', 'b'], expectedResult: [[1, 'a'], [2, 'b']] },
		{ a: [1], b: ['a', 'b'], expectedResult: [[1, 'a']] }
	])('zip($a, $b) -> $expectedResult', ({ a, b, expectedResult }) => {
		expect(collectToArray(zip<number, [string]>(a, b))).toEqual(expectedResult);
	});

	test('zip reads several iterables, up to the shortest', () => {
		expect(collectToArray(zip([1, 2, 3], 'ab', new Set([true, false, true])))).toEqual([[1, 'a', true], [2, 'b', false]]);
	});

	test('zip(iterable) yields tuples of one value', () => {
		expect(collectToArray(zip([1, 2]))).toEqual([[1], [2]]);
	});

	test('zip is transformation', () => {
		expectTransformation(source => zip(source, range(10)));
		expectTransformation(source => zip(range(10), source));
	});

	test('zip allows re-run', () => {
		const zipped = zip(range(2), 'ab');
		expect(collectToArray(zipped)).toEqual([[0, 'a'], [1, 'b']]);
		expect(collectToArray(zipped)).toEqual([[0, 'a'], [1, 'b']]);
	});

	test('zip yields a new tuple at each step', () => {
		const [first, second] = collectToArray(zip([1, 2], [3, 4]));
		expect(first).not.toBe(second);
	});

	test('zip reads one value from each iterable per tuple', () => {
		const a = spyIterable([1, 2, 3]);
		const b = spyIterable([4, 5, 6]);
		const it = zip(a, b)[Symbol.iterator]();
		it.next();
		expect([a.stats.reads, b.stats.reads]).toEqual([1, 1]);
	});

	test('zip works with infinite sources', () => {
		const { stats, iterable } = infiniteSource();
		expect(collectToArray(zip(iterable, ['a', 'b']))).toEqual([[0, 'a'], [1, 'b']]);
		expect(stats.closed).toBe(true);
		const other = infiniteSource();
		expect(collectToArray(take(zip(other.iterable, infiniteSource().iterable), 2))).toEqual([[0, 0], [1, 1]]);
		expect(other.stats.closed).toBe(true);
	});

	test('the end of an iterable closes the others, before and after it', () => {
		const before = closableSource([1, 2, 3]);
		const after = closableSource([1, 2, 3]);
		expect(collectToArray(zip(before.iterable, [1], after.iterable))).toEqual([[1, 1, 1]]);
		expect(before.state.closed).toBe(true);
		expect(after.state.closed).toBe(true);
	});

	test('an error of an iterable closes the others, not the one that threw', () => {
		const error = new Error('source');
		const before = closableSource([1, 2, 3]);
		const after = closableSource([1, 2, 3]);
		const { returnSpy, iterable } = throwingSource(2, error);
		expect(() => collectToArray(zip(before.iterable, iterable, after.iterable))).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
		expect(before.state.closed).toBe(true);
		expect(after.state.closed).toBe(true);
	});

	test('an error of an iterator creation closes the iterators already open', () => {
		const error = new Error('iterator');
		const { state, iterable } = closableSource([1, 2]);
		const opened = { [Symbol.iterator]: () => {
			const it = iterable[Symbol.iterator]();
			it.next();
			return it;
		} };
		const failing = { [Symbol.iterator]: () => { throw error; } };
		expect(() => collectToArray(zip(opened, failing))).toThrow(error);
		expect(state.closed).toBe(true);
	});

	test('a return() that throws does not leave the other iterators open', () => {
		const error = new Error('return');
		const failing = {
			[Symbol.iterator]: () => ({
				next: () => ({ done: false as const, value: 1 }),
				return: () => { throw error; }
			})
		};
		const { state, iterable } = closableSource([1, 2]);
		const it = zip(iterable, failing)[Symbol.iterator]();
		it.next();
		expect(() => it.return!()).toThrow(error);
		expect(state.closed).toBe(true);
	});

	test('return() closes every iterable', () => {
		const a = closableSource([1, 2]);
		const b = closableSource([3, 4]);
		const it = zip(a.iterable, b.iterable)[Symbol.iterator]();
		it.next();
		it.return!();
		expect([a.state.closed, b.state.closed]).toEqual([true, true]);
	});

	test('iterator stays done', () => {
		const it = zip([1, 2], [3])[Symbol.iterator]();
		expect(it.next().value).toEqual([1, 3]);
		for (let i = 0; i < 3; i++)
			expect(it.next().done).toBe(true);
	});

	test('the values are tuples of the types of the iterables', () => {
		expectTypeOf(zip([1], ['a'])).toEqualTypeOf<Iterable<[number, string]>>();
		expectTypeOf(zip([1], ['a'], new Set([true]))).toEqualTypeOf<Iterable<[number, string, boolean]>>();
		expectTypeOf(zip([1])).toEqualTypeOf<Iterable<[number]>>();
	});

});
