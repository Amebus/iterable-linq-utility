import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectTransformation } from '../_helpers/operationKind';

import { intersect, take } from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

describe('intersect', () => {
	test('rejects a missing or invalid iterable', () => {
		withoutInputIterableThrowsException((iterable: any) => intersect(iterable, []), 'intersect');
	});

	test.each([null, undefined, 42, {}])('rejects an invalid other %j', other => {
		expect(() => intersect([1], other as never)).toThrow(/^\[iterable-linq-utility\/intersect\] The (provided )?"sourceIterable"/);
	});

	test.each([null, false, 0, 'key', {}])('rejects invalid keySelector %j immediately', keySelector => {
		const source = spyIterable([1, 2]);
		expect(() => intersect(source, [], keySelector as never)).toThrow(new Error('[iterable-linq-utility/intersect] The "keySelector" function must be provided'));
		expect(source.stats).toEqual({ iterations: 0, reads: 0 });
	});

	test.each([
		{ values: [], other: [1], expected: [] },
		{ values: [1, 2], other: [], expected: [] },
		{ values: [1, 2, 2, 3], other: [2, 3, 4], expected: [2, 3] },
		{ values: [3, 1, 3, 2], other: [2, 2, 3], expected: [3, 2] },
		{ values: [1, 2], other: [3, 4], expected: [] }
	])('intersect($values, $other) -> $expected', ({ values, other, expected }) => {
		expect(Array.from(intersect(values, other))).toEqual(expected);
		expect(Array.from(intersect(values, other, undefined))).toEqual(expected);
	});

	test('uses SameValueZero', () => {
		const result = Array.from(intersect([NaN, -0, 1], [0, NaN, NaN]));
		expect(result).toEqual([NaN, -0]);
		expect(Object.is(result[1], -0)).toBe(true);
	});

	test('compares objects by reference without a selector', () => {
		const first = { id: 1 };
		const second = { id: 1 };
		expect(Array.from(intersect([first, second], [first]))).toEqual([first]);
	});

	test('keeps the first value for each selected key, with the index in its own source', () => {
		const calls: [string, number][] = [];
		const values = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }, { id: 2, name: 'b2' }];
		const result = Array.from(intersect(values, [{ id: 2, name: 'o' }], (value, index) => {
			calls.push([value.name, index]);
			return value.id;
		}));
		expect(result).toEqual([values[1]]);
		expect(calls).toEqual([['o', 0], ['a', 0], ['b', 1], ['b2', 2]]);
	});

	test('is a lazy, re-runnable Transformation that reads other again on each run', () => {
		expectTransformation(source => intersect(source, [2, 3]));
		expectTransformation(source => intersect([1, 2], source));
		expectTransformation(source => intersect(source, [2], value => value % 2));
	});

	test('reads the whole other before the first value of the source', () => {
		const source = spyIterable([2, 9]);
		const other = spyIterable([2, 3, 4]);
		const iterator = intersect(source, other)[Symbol.iterator]();
		expect(other.stats.reads).toBe(0);
		expect(iterator.next()).toEqual({ done: false, value: 2 });
		expect(other.stats).toEqual({ iterations: 1, reads: 3 });
		expect(source.stats.reads).toBe(1);
		iterator.next();
		expect(other.stats.iterations).toBe(1);
	});

	test('works on an infinite source with take', () => {
		const source = infiniteSource(10);
		expect(Array.from(take(intersect(source.iterable, [2, 3]), 2))).toEqual([2, 3]);
		expect(source.stats.closed).toBe(true);
	});

	test('closes the source on an early consumer exit', () => {
		const source = closableSource([1, 2, 3, 4]);
		expect(Array.from(take(intersect(source.iterable, [2, 3]), 1))).toEqual([2]);
		expect(source.state.closed).toBe(true);
	});

	test('closes both sources and becomes done when the keySelector throws on other', () => {
		const error = new Error('selector');
		const source = throwingSource(100, new Error('unused'));
		const other = closableSource([1, 2]);
		const iterator = intersect(source.iterable, other.iterable, () => { throw error; })[Symbol.iterator]();
		expect(() => iterator.next()).toThrow(error);
		expect(source.returnSpy).toHaveBeenCalledOnce();
		expect(other.state.closed).toBe(true);
		expect(iterator.next().done).toBe(true);
		iterator.return!();
		expect(source.returnSpy).toHaveBeenCalledOnce();
	});

	test('closes the source and becomes done when the keySelector throws on the source', () => {
		const error = new Error('selector');
		const source = throwingSource(100, new Error('unused'));
		const iterator = intersect(source.iterable, [1], (value: number) => { if (value === 2) throw error; return value; })[Symbol.iterator]();
		expect(() => Array.from({ [Symbol.iterator]: () => iterator })).toThrow(error);
		expect(source.returnSpy).toHaveBeenCalledOnce();
		expect(iterator.next().done).toBe(true);
	});

	test('closes the source and propagates the error when other throws', () => {
		const error = new Error('other');
		const source = throwingSource(100, new Error('unused'));
		const other = throwingSource(2, error);
		const iterator = intersect(source.iterable, other.iterable)[Symbol.iterator]();
		expect(() => iterator.next()).toThrow(error);
		expect(source.returnSpy).toHaveBeenCalledOnce();
		expect(iterator.next().done).toBe(true);
	});

	test('propagates source errors without closing', () => {
		const error = new Error('source');
		const source = throwingSource(1, error);
		const iterator = intersect(source.iterable, [])[Symbol.iterator]();
		expect(() => iterator.next()).toThrow(error);
		expect(source.returnSpy).not.toHaveBeenCalled();
		iterator.return!();
	});

	test('forwards return values once and remains done', () => {
		const source = throwingSource(100, new Error('unused'));
		const iterator = intersect(source.iterable, [])[Symbol.iterator]();
		expect(iterator.return!('end')).toEqual({ done: true, value: 'end' });
		iterator.return!();
		expect(iterator.next().done).toBe(true);
		expect(source.returnSpy).toHaveBeenCalledExactlyOnceWith('end');
	});

	test('preserves the element type and infers selector arguments', () => {
		expectTypeOf(intersect([1], [2])).toEqualTypeOf<Iterable<number>>();
		intersect(['a'], ['b'], (value, index) => {
			expectTypeOf(value).toEqualTypeOf<string>();
			expectTypeOf(index).toEqualTypeOf<number>();
			return value;
		});
	});
});
