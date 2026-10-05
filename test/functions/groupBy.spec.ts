import { describe, expect, expectTypeOf, test } from 'vitest';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectTransformation } from '../_helpers/operationKind';

import { groupBy, take } from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

describe('groupBy', () => {
	test('rejects a missing or invalid iterable', () => {
		withoutInputIterableThrowsException((iterable: any) => groupBy(iterable, v => v), 'groupBy');
	});

	test.each([undefined, null, false, 0, 'key', {}])('rejects invalid keySelector %j immediately', keySelector => {
		const source = spyIterable([1, 2]);
		expect(() => groupBy(source, keySelector as never)).toThrow(new Error('[iterable-linq-utility/groupBy] The "keySelector" function must be provided'));
		expect(source.stats).toEqual({ iterations: 0, reads: 0 });
	});

	test.each([
		{ values: [], expected: [] },
		{ values: [1], expected: [[1, [1]]] },
		{ values: [1, 2, 3, 4, 5], expected: [[1, [1, 3, 5]], [0, [2, 4]]] },
		{ values: [2, 4, 1], expected: [[0, [2, 4]], [1, [1]]] }
	])('groupBy($values, v => v % 2) -> $expected', ({ values, expected }) => {
		expect(Array.from(groupBy(values, v => v % 2))).toEqual(expected);
	});

	test('yields the groups in the order of the first appearance of their key, the values in the order of the source', () => {
		const words = ['bb', 'a', 'ccc', 'dd', 'e'];
		expect(Array.from(groupBy(words, v => v.length))).toEqual([[2, ['bb', 'dd']], [1, ['a', 'e']], [3, ['ccc']]]);
	});

	test('compares the keys with SameValueZero, null and undefined included', () => {
		const result = Array.from(groupBy([1, 2, 3, 4, 5, 6], v => [NaN, -0, null, undefined, NaN, 0][v - 1]));
		// like Map, -0 becomes the key +0
		expect(result).toEqual([[NaN, [1, 5]], [0, [2, 6]], [null, [3]], [undefined, [4]]]);
	});

	test('compares object keys by reference', () => {
		const first = { id: 1 };
		const second = { id: 1 };
		expect(Array.from(groupBy([first, second, first], v => v))).toEqual([[first, [first, first]], [second, [second]]]);
	});

	test('calls the keySelector with each value and its index', () => {
		const calls: [string, number][] = [];
		Array.from(groupBy(['a', 'b', 'c'], (value, index) => {
			calls.push([value, index]);
			return value;
		}));
		expect(calls).toEqual([['a', 0], ['b', 1], ['c', 2]]);
	});

	test('is a lazy, re-runnable Transformation', () => {
		expectTransformation(source => groupBy(source, v => v % 2));
	});

	test('reads the whole source before the first group', () => {
		const source = spyIterable([1, 2, 3]);
		const iterator = groupBy(source, v => v % 2)[Symbol.iterator]();
		expect(source.stats.reads).toBe(0);
		expect(iterator.next()).toEqual({ done: false, value: [1, [1, 3]] });
		expect(source.stats).toEqual({ iterations: 1, reads: 3 });
	});

	test('builds new groups on every run', () => {
		const grouped = groupBy([1, 2, 3], v => v % 2);
		const first = Array.from(grouped);
		first[0][1].push(99);
		expect(Array.from(grouped)).toEqual([[1, [1, 3]], [0, [2]]]);
	});

	test('stops yielding groups on an early consumer exit', () => {
		expect(Array.from(take(groupBy([1, 2, 3], v => v), 2))).toEqual([[1, [1]], [2, [2]]]);
	});

	test('closes the source and becomes done when the keySelector throws', () => {
		const error = new Error('selector');
		const source = throwingSource(100, new Error('unused'));
		const iterator = groupBy(source.iterable, (value: number) => { if (value === 2) throw error; return value; })[Symbol.iterator]();
		expect(() => iterator.next()).toThrow(error);
		expect(source.returnSpy).toHaveBeenCalledOnce();
		expect(iterator.next().done).toBe(true);
		iterator.return!();
		expect(source.returnSpy).toHaveBeenCalledOnce();
	});

	test('propagates source errors without closing', () => {
		const error = new Error('source');
		const source = throwingSource(2, error);
		const iterator = groupBy(source.iterable, v => v)[Symbol.iterator]();
		expect(() => iterator.next()).toThrow(error);
		expect(source.returnSpy).not.toHaveBeenCalled();
		iterator.return!();
	});

	test('forwards return values once and remains done', () => {
		const source = throwingSource(100, new Error('unused'));
		const iterator = groupBy(source.iterable, v => v)[Symbol.iterator]();
		expect(iterator.return!('end')).toEqual({ done: true, value: 'end' });
		iterator.return!();
		expect(iterator.next().done).toBe(true);
		expect(source.returnSpy).toHaveBeenCalledExactlyOnceWith('end');
	});

	test('infers the key and value types', () => {
		expectTypeOf(groupBy(['a'], v => v.length)).toEqualTypeOf<Iterable<[number, string[]]>>();
		groupBy(['a'], (value, index) => {
			expectTypeOf(value).toEqualTypeOf<string>();
			expectTypeOf(index).toEqualTypeOf<number>();
			return value;
		});
	});
});
