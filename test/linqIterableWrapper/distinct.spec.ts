import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { expectTransformation } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('IterableLinq.distinct', () => {
	test.each([null, false, 0, 'key', {}])('rejects invalid keySelector %j', keySelector => {
		expect(() => IterableLinq.from([1]).distinct(keySelector as never)).toThrow(new Error('[iterable-linq-utility/distinct] The "keySelector" function must be provided'));
	});

	test.each([
		{ values: [], expected: [] },
		{ values: [3, 1, 3, 2, 1], expected: [3, 1, 2] },
		{ values: [1, 1, 1], expected: [1] }
	])('keeps first occurrences in $values', ({ values, expected }) => {
		expect(IterableLinq.from(values).distinct().collectToArray()).toEqual(expected);
		expect(IterableLinq.from(values).distinct(undefined).collectToArray()).toEqual(expected);
	});

	test('uses SameValueZero and preserves the original signed zero', () => {
		const result = IterableLinq.from([NaN, NaN, -0, 0]).distinct().collectToArray();
		expect(result).toEqual([NaN, -0]);
		expect(Object.is(result[1], -0)).toBe(true);
	});

	test('keeps first objects by selected key and composes with map', () => {
		const values = [{ id: 2, name: 'first' }, { id: 1, name: 'second' }, { id: 2, name: 'duplicate' }];
		const result = IterableLinq.from(values).distinct(value => value.id);
		expect(result.collectToArray()[0]).toBe(values[0]);
		expect(result.map(value => value.name).collectToArray()).toEqual(['first', 'second']);
	});

	test('compares objects by reference without a selector', () => {
		const first = { id: 1 };
		const second = { id: 1 };
		expect(IterableLinq.from([first, first, second]).distinct().collectToArray()).toEqual([first, second]);
	});

	test('is a lazy, re-runnable Transformation in both forms', () => {
		expectTransformation(source => IterableLinq.from(source).distinct());
		expectTransformation(source => IterableLinq.from(source).distinct(value => value % 2));
	});

	test('passes every source index to the selector and resets each run', () => {
		const indexes: number[] = [];
		const result = IterableLinq.from([1, 1, 2]).distinct((value, index) => {
			indexes.push(index);
			return value;
		});
		expect(indexes).toEqual([]);
		expect(result.collectToArray()).toEqual([1, 2]);
		expect(result.collectToArray()).toEqual([1, 2]);
		expect(indexes).toEqual([0, 1, 2, 0, 1, 2]);
	});

	test('iterators keep independent sets', () => {
		const result = IterableLinq.from([1, 1, 2]).distinct(value => value);
		const a = result[Symbol.iterator]();
		const b = result[Symbol.iterator]();
		expect(a.next().value).toBe(1);
		expect(a.next().value).toBe(2);
		expect(b.next().value).toBe(1);
		expect(b.next().value).toBe(2);
	});

	test('handles an infinite repeated source with take without reading ahead', () => {
		const source = infiniteSource(5);
		const result = IterableLinq.from(source.iterable).map(value => Math.floor(value / 2)).distinct().take(3);
		expect(result.collectToArray()).toEqual([0, 1, 2]);
		expect(source.stats).toEqual({ reads: 5, closed: true });
	});

	test('closes the source when a downstream action stops early', () => {
		const source = closableSource([1, 1, 2, 3]);
		expect(IterableLinq.from(source.iterable).distinct().some(value => value === 2)).toBe(true);
		expect(source.state.closed).toBe(true);
	});

	test('closes the source when the selector throws', () => {
		const error = new Error('selector');
		const source = closableSource([1, 1, 2]);
		expect(() => IterableLinq.from(source.iterable).distinct(() => { throw error; }).collectToArray()).toThrow(error);
		expect(source.state.closed).toBe(true);
	});

	test('preserves element types with and without a selector', () => {
		const source = IterableLinq.from<number | string>([1, 'one']);
		expectTypeOf(source.distinct()).toEqualTypeOf<IterableLinq.IIterableLinq<number | string>>();
		expectTypeOf(source.distinct(undefined)).toEqualTypeOf<IterableLinq.IIterableLinq<number | string>>();
		const result = source.distinct((value, index) => {
			expectTypeOf(value).toEqualTypeOf<number | string>();
			expectTypeOf(index).toEqualTypeOf<number>();
			return String(value);
		});
		expectTypeOf(result.collectToArray()).toEqualTypeOf<(number | string)[]>();
		expect(result.collectToArray()).toEqual([1, 'one']);
	});
});
