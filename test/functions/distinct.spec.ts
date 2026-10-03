import { describe, expect, expectTypeOf, test, vi } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectTransformation } from '../_helpers/operationKind';

import { distinct, map, take } from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

describe('distinct', () => {
	test('rejects a missing or invalid iterable', () => {
		withoutInputIterableThrowsException(distinct);
	});

	test.each([null, false, 0, 'key', {}])('rejects invalid keySelector %j immediately', keySelector => {
		const source = spyIterable([1, 2]);
		expect(() => distinct(source, keySelector as never)).toThrow('The "keySelector" function must be provided');
		expect(source.stats).toEqual({ iterations: 0, reads: 0 });
	});

	test.each([
		{ values: [], expected: [] },
		{ values: [1], expected: [1] },
		{ values: [3, 1, 3, 2, 1], expected: [3, 1, 2] },
		{ values: [1, 1, 1], expected: [1] },
		{ values: [1, 2, 3], expected: [1, 2, 3] }
	])('keeps first occurrences in $values', ({ values, expected }) => {
		expect(Array.from(distinct(values))).toEqual(expected);
		expect(Array.from(distinct(values, undefined))).toEqual(expected);
	});

	test('works on a string iterable', () => {
		expect(Array.from(distinct('banana'))).toEqual(['b', 'a', 'n']);
	});

	test('uses SameValueZero for primitive values', () => {
		const symbol = Symbol('key');
		const otherSymbol = Symbol('key');
		const values = [NaN, NaN, -0, 0, undefined, undefined, null, null, 1, '1', symbol, symbol, otherSymbol];
		const result = Array.from(distinct(values));
		expect(result).toEqual([NaN, -0, undefined, null, 1, '1', symbol, otherSymbol]);
		expect(Object.is(result[1], -0)).toBe(true);
	});

	test('compares objects by reference without a selector', () => {
		const first = { id: 1 };
		const second = { id: 1 };
		const result = Array.from(distinct([first, second, first]));
		expect(result).toHaveLength(2);
		expect(result[0]).toBe(first);
		expect(result[1]).toBe(second);
	});

	test('keeps original first objects for equal keys', () => {
		const first = { id: 2, name: 'first' };
		const second = { id: 1, name: 'second' };
		const result = Array.from(distinct([first, second, { id: 2, name: 'duplicate' }], value => value.id));
		expect(result).toEqual([first, second]);
		expect(result[0]).toBe(first);
	});

	test('uses SameValueZero for selected keys', () => {
		const values = [NaN, NaN, -0, 0, null, null, undefined, undefined].map((key, index) => ({ key, index }));
		expect(Array.from(distinct(values, value => value.key))).toEqual([values[0], values[2], values[4], values[6]]);
	});

	test('allows object keys and distinguishes their references', () => {
		const key = {};
		const values = [{ key, id: 1 }, { key, id: 2 }, { key: {}, id: 3 }];
		expect(Array.from(distinct(values, value => value.key))).toEqual([values[0], values[2]]);
	});

	test('is a lazy, re-runnable Transformation in both forms', () => {
		expectTransformation(source => distinct(source));
		expectTransformation(source => distinct(source, value => value % 2));
	});

	test('calls the selector for every source value with source indexes on each run', () => {
		const calls: [number, number][] = [];
		const source = spyIterable([2, 2, 1, 2]);
		const result = distinct(source, (value, index) => {
			calls.push([value, index]);
			return value;
		});
		expect(calls).toEqual([]);
		expect(source.stats).toEqual({ iterations: 0, reads: 0 });
		expect(Array.from(result)).toEqual([2, 1]);
		expect(Array.from(result)).toEqual([2, 1]);
		expect(calls).toEqual([[2, 0], [2, 1], [1, 2], [2, 3], [2, 0], [2, 1], [1, 2], [2, 3]]);
		expect(source.stats).toEqual({ iterations: 2, reads: 8 });
	});

	test.each([false, true])('iterators have independent seen keys (selector: %s)', useSelector => {
		const result = distinct([1, 1, 2], useSelector ? value => value : undefined);
		const a = result[Symbol.iterator]();
		const b = result[Symbol.iterator]();
		expect(a.next()).toEqual({ done: false, value: 1 });
		expect(a.next()).toEqual({ done: false, value: 2 });
		expect(b.next()).toEqual({ done: false, value: 1 });
		expect(b.next()).toEqual({ done: false, value: 2 });
		expect(a.next().done).toBe(true);
		expect(b.next().done).toBe(true);
	});

	test('reads only through the next unseen value', () => {
		const source = spyIterable([1, 1, 1, 2, 3]);
		const iterator = distinct(source)[Symbol.iterator]();
		expect(iterator.next()).toEqual({ done: false, value: 1 });
		expect(source.stats.reads).toBe(1);
		expect(iterator.next()).toEqual({ done: false, value: 2 });
		expect(source.stats.reads).toBe(4);
		iterator.return!();
		expect(source.stats.reads).toBe(4);
	});

	test('handles an infinite source of repeated values with take', () => {
		const source = infiniteSource(5);
		const repeated = map(source.iterable, value => Math.floor(value / 2));
		expect(Array.from(take(distinct(repeated), 3))).toEqual([0, 1, 2]);
		expect(source.stats).toEqual({ reads: 5, closed: true });
	});

	test('closes the source on an early consumer exit', () => {
		const source = closableSource([1, 1, 2]);
		for (const value of distinct(source.iterable)) {
			expect(value).toBe(1);
			break;
		}
		expect(source.state.closed).toBe(true);
	});

	test('forwards return values only once and remains done', () => {
		const source = throwingSource(100, new Error('unused'));
		const iterator = distinct(source.iterable)[Symbol.iterator]();
		iterator.next();
		expect(iterator.return!('end')).toEqual({ done: true, value: 'end' });
		iterator.return!();
		expect(iterator.next().done).toBe(true);
		expect(source.returnSpy).toHaveBeenCalledExactlyOnceWith('end');
	});

	test('stays done after exhaustion without closing the exhausted source', () => {
		const returnSpy = vi.fn();
		const next = vi.fn().mockReturnValueOnce({ done: false, value: 1 }).mockReturnValue({ done: true, value: 'end' });
		const iterator = distinct({ [Symbol.iterator]: () => ({ next, return: returnSpy }) })[Symbol.iterator]();
		iterator.next();
		expect(iterator.next()).toEqual({ done: true, value: 'end' });
		expect(iterator.next().done).toBe(true);
		iterator.return!();
		expect(next).toHaveBeenCalledTimes(2);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	test('closes the source and becomes done when a selector throws', () => {
		const error = new Error('selector');
		const source = throwingSource(100, new Error('unused'));
		const iterator = distinct(source.iterable, () => { throw error; })[Symbol.iterator]();
		expect(() => iterator.next()).toThrow(error);
		expect(source.returnSpy).toHaveBeenCalledOnce();
		expect(iterator.next().done).toBe(true);
		iterator.return!();
		expect(source.returnSpy).toHaveBeenCalledOnce();
	});

	test('preserves the selector error when source closing also throws', () => {
		const error = new Error('selector');
		const source = throwingSource(100, new Error('unused'));
		source.returnSpy.mockImplementation(() => { throw new Error('close'); });
		const iterator = distinct(source.iterable, () => { throw error; })[Symbol.iterator]();
		expect(() => iterator.next()).toThrow(error);
		expect(iterator.next().done).toBe(true);
	});

	test('propagates source errors without closing and can read again', () => {
		const error = new Error('source');
		const source = throwingSource(2, error);
		const iterator = distinct(source.iterable)[Symbol.iterator]();
		expect(iterator.next()).toEqual({ done: false, value: 1 });
		expect(() => iterator.next()).toThrow(error);
		expect(source.returnSpy).not.toHaveBeenCalled();
		expect(iterator.next()).toEqual({ done: false, value: 3 });
		iterator.return!();
	});

	test('preserves the element type and infers selector arguments', () => {
		const values: (number | string)[] = [1, 'one'];
		expectTypeOf(distinct(values)).toEqualTypeOf<Iterable<number | string>>();
		expectTypeOf(distinct(values, undefined)).toEqualTypeOf<Iterable<number | string>>();
		const result = distinct(values, (value, index) => {
			expectTypeOf(value).toEqualTypeOf<number | string>();
			expectTypeOf(index).toEqualTypeOf<number>();
			return String(value);
		});
		expectTypeOf(result).toEqualTypeOf<Iterable<number | string>>();
		expect(Array.from(result)).toEqual([1, 'one']);
	});
});
