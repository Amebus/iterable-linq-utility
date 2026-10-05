import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectTransformation } from '../_helpers/operationKind';

import { take, union } from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

describe('union', () => {
	test('rejects a missing or invalid iterable', () => {
		withoutInputIterableThrowsException((iterable: any) => union(iterable, []), 'union');
	});

	test.each([null, undefined, 42, {}])('rejects an invalid other %j', other => {
		expect(() => union([1], other as never)).toThrow(/^\[iterable-linq-utility\/union\] The (provided )?"sourceIterable"/);
	});

	test.each([null, false, 0, 'key', {}])('rejects invalid keySelector %j immediately', keySelector => {
		const source = spyIterable([1, 2]);
		expect(() => union(source, [], keySelector as never)).toThrow(new Error('[iterable-linq-utility/union] The "keySelector" function must be provided'));
		expect(source.stats).toEqual({ iterations: 0, reads: 0 });
	});

	test.each([
		{ values: [], other: [], expected: [] },
		{ values: [1, 2], other: [], expected: [1, 2] },
		{ values: [], other: [1, 1, 2], expected: [1, 2] },
		{ values: [1, 2, 2], other: [2, 3], expected: [1, 2, 3] },
		{ values: [3, 1, 3], other: [2, 1, 4, 2], expected: [3, 1, 2, 4] }
	])('union($values, $other) -> $expected', ({ values, other, expected }) => {
		expect(Array.from(union(values, other))).toEqual(expected);
		expect(Array.from(union(values, other, undefined))).toEqual(expected);
	});

	test('uses SameValueZero', () => {
		const result = Array.from(union([NaN, -0], [NaN, 0, null, null]));
		expect(result).toEqual([NaN, -0, null]);
		expect(Object.is(result[1], -0)).toBe(true);
	});

	test('keeps the first value for each selected key, with the index in its own source', () => {
		const calls: [string, number][] = [];
		const values = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }];
		const other = [{ id: 2, name: 'c' }, { id: 3, name: 'd' }];
		const result = Array.from(union(values, other, (value, index) => {
			calls.push([value.name, index]);
			return value.id;
		}));
		expect(result).toEqual([values[0], values[1], other[1]]);
		expect(result[1]).toBe(values[1]);
		expect(calls).toEqual([['a', 0], ['b', 1], ['c', 0], ['d', 1]]);
	});

	test('is a lazy, re-runnable Transformation on both sources', () => {
		expectTransformation(source => union(source, [9]));
		expectTransformation(source => union([9], source));
		expectTransformation(source => union(source, [9], value => value % 2));
	});

	test('opens other only when the source ends', () => {
		const source = spyIterable([1, 2]);
		const other = spyIterable([3]);
		const iterator = union(source, other)[Symbol.iterator]();
		iterator.next();
		iterator.next();
		expect(other.stats.iterations).toBe(0);
		expect(iterator.next()).toEqual({ done: false, value: 3 });
		expect(other.stats.iterations).toBe(1);
		expect(iterator.next().done).toBe(true);
	});

	test('never reads other after an infinite source', () => {
		const source = infiniteSource(5);
		const other = spyIterable([1]);
		expect(Array.from(take(union(source.iterable, other), 3))).toEqual([0, 1, 2]);
		expect(source.stats).toEqual({ reads: 3, closed: true });
		expect(other.stats.iterations).toBe(0);
	});

	test('closes only the source being read on an early exit', () => {
		const source = closableSource([1, 2]);
		const other = closableSource([3, 4]);
		expect(Array.from(take(union(source.iterable, other.iterable), 1))).toEqual([1]);
		expect(source.state).toEqual({ closed: true });
		expect(other.state).toEqual({ closed: false });

		const first = closableSource([1]);
		const second = closableSource([2, 3]);
		expect(Array.from(take(union(first.iterable, second.iterable), 2))).toEqual([1, 2]);
		expect(first.state).toEqual({ closed: true });
		expect(second.state).toEqual({ closed: true });
	});

	test('closes the source being read and becomes done when the keySelector throws', () => {
		const error = new Error('selector');
		const source = throwingSource(100, new Error('unused'));
		const iterator = union(source.iterable, [], () => { throw error; })[Symbol.iterator]();
		expect(() => iterator.next()).toThrow(error);
		expect(source.returnSpy).toHaveBeenCalledOnce();
		expect(iterator.next().done).toBe(true);

		const other = throwingSource(100, new Error('unused'));
		const onOther = union([1], other.iterable, value => { if (value !== 1) throw error; return value; })[Symbol.iterator]();
		expect(onOther.next()).toEqual({ done: false, value: 1 });
		expect(() => onOther.next()).toThrow(error);
		expect(other.returnSpy).toHaveBeenCalledOnce();
	});

	test('propagates source errors without closing', () => {
		const error = new Error('source');
		const source = throwingSource(2, error);
		const iterator = union(source.iterable, [])[Symbol.iterator]();
		expect(iterator.next()).toEqual({ done: false, value: 1 });
		expect(() => iterator.next()).toThrow(error);
		expect(source.returnSpy).not.toHaveBeenCalled();
		iterator.return!();
	});

	test('an error opening other leaves nothing to close', () => {
		const error = new Error('open');
		const iterator = union([1], { [Symbol.iterator]: () => { throw error; } })[Symbol.iterator]();
		iterator.next();
		expect(() => iterator.next()).toThrow(error);
		expect(iterator.return!().done).toBe(true);
	});

	test('forwards return values once and remains done', () => {
		const source = throwingSource(100, new Error('unused'));
		const iterator = union(source.iterable, [])[Symbol.iterator]();
		iterator.next();
		expect(iterator.return!('end')).toEqual({ done: true, value: 'end' });
		iterator.return!();
		expect(iterator.next().done).toBe(true);
		expect(source.returnSpy).toHaveBeenCalledExactlyOnceWith('end');
	});

	test('preserves the element type and infers selector arguments', () => {
		expectTypeOf(union([1], [2])).toEqualTypeOf<Iterable<number>>();
		union(['a'], ['b'], (value, index) => {
			expectTypeOf(value).toEqualTypeOf<string>();
			expectTypeOf(index).toEqualTypeOf<number>();
			return value;
		});
	});
});
