import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectTransformation } from '../_helpers/operationKind';

import * as Functions from '@/functions';
import { returnClosesTheIterator, withoutInputIterableThrowsException } from './functionsTestUtility';

const { collectToArray, range, take } = Functions;
// `with` is a reserved word: it can be a property, not a variable
const withValue = Functions.with;

const indexes = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];

describe('with', () => {

	test('with without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(withValue, 'with');
	});

	test.each([2.5, NaN, Infinity, -Infinity, undefined, null, '2'])('with(range(10), %s, 0) -> throw exception', index => {
		expect(() => withValue(range(10), index as any, 0)).toThrow(new Error('[iterable-linq-utility/with] The "index" parameter must be an integer'));
	});

	test.each([
		{ index: 3 },
		{ index: -3 }
	])('with(range(20), $index, 0)[Symbol.iterator]().return() closes the iterator', ({ index }) => {
		returnClosesTheIterator(withValue(range(20), index, 0), 'a value');
	});

	test.each([1, 2, 3, 4, 5])('with yields the values of Array.prototype.with on %i values, for every index in range', length => {
		const values = Array.from({ length }, (_, i) => i * 10);
		for (const index of indexes.filter(i => i >= -length && i < length))
			expect(collectToArray(withValue(values, index, -1)), `with(${length} values, ${index})`).toEqual(values.with(index, -1));
	});

	test.each([0, 1, 2, 3])('with throws at the end of a source of %i values, for every index out of range', length => {
		const values = Array.from({ length }, (_, i) => i);
		for (const index of indexes.filter(i => i < -length || i >= length)) {
			expect(() => values.with(index, -1)).toThrow(RangeError);
			expect(() => collectToArray(withValue(values, index, -1)), `with(${length} values, ${index})`)
				.toThrow(new Error(`[iterable-linq-utility/with] The "index" parameter is out of range: the source has ${length} values`));
		}
	});

	test('with an index out of range yields the values before throwing', () => {
		const it = withValue([1, 2], 5, 0)[Symbol.iterator]();
		expect([it.next().value, it.next().value]).toEqual([1, 2]);
		expect(() => it.next()).toThrow(/out of range/);
	});

	test.each([3, -3])('with(iterable, %i, value) is transformation', index => {
		expectTransformation(source => withValue(source, index, 0));
	});

	test('with allows re-run', () => {
		const replaced = withValue(range(3), -1, 9);
		expect(collectToArray(replaced)).toEqual([0, 1, 9]);
		expect(collectToArray(replaced)).toEqual([0, 1, 9]);
	});

	test('a non-negative index yields each value as it is read', () => {
		const source = spyIterable([1, 2, 3]);
		const it = withValue(source, 2, 0)[Symbol.iterator]();
		expect(it.next().value).toBe(1);
		expect(source.stats.reads).toBe(1);
	});

	test('a negative index yields a value once -index more values have been read', () => {
		const source = spyIterable([1, 2, 3, 4]);
		const it = withValue(source, -2, 0)[Symbol.iterator]();
		expect(it.next().value).toBe(1);
		expect(source.stats.reads).toBe(3);
	});

	test('with works with an infinite source', () => {
		const { stats, iterable } = infiniteSource();
		expect(collectToArray(take(withValue(iterable, 1, -1), 3))).toEqual([0, -1, 2]);
		expect(stats.closed).toBe(true);
		const other = infiniteSource();
		expect(collectToArray(take(withValue(other.iterable, -2, -1), 3))).toEqual([0, 1, 2]);
		expect(other.stats.closed).toBe(true);
	});

	test.each([1, -1])('with(iterable, %i): an error of the source propagates, without closing the source', index => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(3, error);
		expect(() => collectToArray(withValue(iterable, index, 0))).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	test.each([1, -1])('with(iterable, %i): return() closes the source', index => {
		const { state, iterable } = closableSource([1, 2, 3]);
		const it = withValue(iterable, index, 0)[Symbol.iterator]();
		it.next();
		it.return!();
		expect(state.closed).toBe(true);
	});

	test.each([1, -1])('with(iterable, %i): iterator stays done', index => {
		const it = withValue([1, 2], index, 0)[Symbol.iterator]();
		expect([it.next(), it.next()].map(r => r.value)).toEqual([1, 0]);
		for (let i = 0; i < 3; i++)
			expect(it.next().done).toBe(true);
	});

	test('the type of the values is the type of the source', () => {
		expectTypeOf(withValue(['a'], 0, 'b')).toEqualTypeOf<Iterable<string>>();
	});

});
