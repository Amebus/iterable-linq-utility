import { describe, expect, test } from 'vitest';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';

import { map, materialize, memoize } from '@/functions';
import { arrayOf, isPlainArray, isPlainMap, isPlainSet } from '@/utils';
import { failedMemoize, unfinishedMemoize } from '../functions/functionsTestUtility';

function* generator(): Generator<number> {
	yield 1;
}

describe('isPlainArray', () => {

	test.each([
		{ name: 'an empty array', value: [] },
		{ name: 'an array', value: [1, 2, 3] },
		// eslint-disable-next-line no-sparse-arrays
		{ name: 'a sparse array', value: [1, , 3] },
		{ name: 'an array from Array.from', value: Array.from({ length: 2 }) },
		{ name: 'a frozen array', value: Object.freeze([1, 2]) }
	])('$name is a plain array', ({ value }) => {
		expect(isPlainArray(value)).toBe(true);
	});

	test('a subclass that keeps the built-in iterator is a plain array', () => {
		class OtherArray<T> extends Array<T> {
			override includes(): boolean { return true; }
		}
		expect(isPlainArray(OtherArray.from([1, 2]))).toBe(true);
	});

	test('a proxy of an array is a plain array', () => {
		expect(isPlainArray(new Proxy([1, 2], {}))).toBe(true);
	});

	test('an array with its own iterator is not a plain array', () => {
		expect(isPlainArray(Object.assign([1, 2], { *[Symbol.iterator]() { yield 3; } }))).toBe(false);
	});

	test('a subclass with its own iterator is not a plain array', () => {
		class OtherArray<T> extends Array<T> {
			override *[Symbol.iterator](): ArrayIterator<T> { yield* super.values(); }
		}
		expect(isPlainArray(OtherArray.from([1, 2]))).toBe(false);
	});

	test.each([
		{ name: 'a string', value: 'abc' },
		{ name: 'a typed array', value: new Uint8Array([1, 2]) },
		{ name: 'a Set', value: new Set([1, 2]) },
		{ name: 'a Map', value: new Map([[1, 2]]) },
		{ name: 'a generator', value: generator() },
		{ name: 'an iterable object', value: spyIterable([1, 2]) },
		{ name: 'an array-like object', value: { length: 1, 0: 1, [Symbol.iterator]: Array.prototype[Symbol.iterator] } }
	])('$name is not a plain array', ({ value }) => {
		expect(isPlainArray(value as Iterable<unknown>)).toBe(false);
	});

});

describe('isPlainSet', () => {

	test.each([
		{ name: 'an empty Set', value: new Set() },
		{ name: 'a Set', value: new Set([1, 2, 3]) }
	])('$name is a plain Set', ({ value }) => {
		expect(isPlainSet(value)).toBe(true);
	});

	test('a subclass that keeps the built-in iterator is a plain Set', () => {
		class OtherSet<T> extends Set<T> {
			override has(): boolean { return true; }
		}
		expect(isPlainSet(new OtherSet([1, 2]))).toBe(true);
	});

	test('a Set with its own iterator is not a plain Set', () => {
		expect(isPlainSet(Object.assign(new Set([1, 2]), { *[Symbol.iterator]() { yield 3; } }))).toBe(false);
	});

	test.each([
		{ name: 'an array', value: [1, 2] },
		{ name: 'a string', value: 'abc' },
		{ name: 'a Map', value: new Map([[1, 2]]) },
		{ name: 'a generator', value: generator() },
		{ name: 'an iterable object', value: spyIterable([1, 2]) },
		{ name: 'an object with the iterator of a Set', value: { [Symbol.iterator]: Set.prototype[Symbol.iterator] } }
	])('$name is not a plain Set', ({ value }) => {
		expect(isPlainSet(value as Iterable<unknown>)).toBe(false);
	});

});

describe('isPlainMap', () => {

	test.each([
		{ name: 'an empty Map', value: new Map() },
		{ name: 'a Map', value: new Map([[1, 2]]) }
	])('$name is a plain Map', ({ value }) => {
		expect(isPlainMap(value)).toBe(true);
	});

	test('a subclass that keeps the built-in iterator is a plain Map', () => {
		class OtherMap<K, V> extends Map<K, V> {
			override get size(): number { return 7; }
		}
		expect(isPlainMap(new OtherMap([[1, 2]]))).toBe(true);
	});

	test('a Map with its own iterator is not a plain Map', () => {
		expect(isPlainMap(Object.assign(new Map([[1, 2]]), { *[Symbol.iterator]() { yield [3, 4] as [number, number]; } }))).toBe(false);
	});

	test.each([
		{ name: 'an array', value: [[1, 2]] },
		{ name: 'a Set', value: new Set([1, 2]) },
		{ name: 'a generator', value: generator() },
		{ name: 'an object with the iterator of a Map', value: { [Symbol.iterator]: Map.prototype[Symbol.iterator] } }
	])('$name is not a plain Map', ({ value }) => {
		expect(isPlainMap(value as Iterable<unknown>)).toBe(false);
	});

});

describe('arrayOf', () => {

	test('arrayOf gives a plain array itself', () => {
		const array = [1, 2, 3];
		expect(arrayOf(array)).toBe(array);
	});

	test('arrayOf gives the stored values of a materialize', () => {
		expect(arrayOf(materialize(map([1, 2, 3], v => v * 10)))).toEqual([10, 20, 30]);
	});

	test('arrayOf gives the same array on every call of a materialize', () => {
		const materialized = materialize([1, 2]);
		expect(arrayOf(materialized)).toBe(arrayOf(materialized));
	});

	test('arrayOf fills a full memoize that is not read yet, reading its source once', () => {
		const source = spyIterable([1, 2, 3]);
		const memoized = memoize(source, { allowPartialMemoization: false });
		expect(arrayOf(memoized)).toEqual([1, 2, 3]);
		expect(arrayOf(memoized)).toEqual([1, 2, 3]);
		expect([...memoized]).toEqual([1, 2, 3]);
		expect(source.stats.iterations).toBe(1);
		expect(source.stats.reads).toBe(3);
	});

	test('arrayOf gives the cache of a partial memoize read to the end', () => {
		const source = spyIterable([1, 2, 3]);
		const memoized = memoize(source);
		expect([...memoized]).toEqual([1, 2, 3]);
		expect(arrayOf(memoized)).toEqual([1, 2, 3]);
		expect(source.stats.reads).toBe(3);
	});

	test('arrayOf gives nothing for a partial memoize that is not finished, and reads nothing', () => {
		const source = spyIterable([1, 2, 3]);
		const memoized = memoize(source);
		expect(arrayOf(memoized)).toBeUndefined();
		expect(source.stats.iterations).toBe(0);
		expect(arrayOf(unfinishedMemoize([1, 2, 3]))).toBeUndefined();
	});

	test.each([
		{ allowPartialMemoization: false },
		{ allowPartialMemoization: true }
	])('arrayOf gives nothing for a memoize whose cache holds an error (allowPartialMemoization: $allowPartialMemoization)', ({ allowPartialMemoization }) => {
		expect(arrayOf(failedMemoize(new Error('source'), allowPartialMemoization))).toBeUndefined();
	});

	test('the error of the source while arrayOf fills a full memoize propagates unchanged, and stays in the cache', () => {
		const error = new Error('source');
		const memoized = memoize(throwingSource(3, error).iterable, { allowPartialMemoization: false });
		expect(() => arrayOf(memoized)).toThrow(error);
		expect(arrayOf(memoized)).toBeUndefined();
		expect(() => [...memoized]).toThrow(error);
	});

	test.each([
		{ name: 'a string', value: 'abc' },
		{ name: 'a Set', value: new Set([1, 2]) },
		{ name: 'a Map', value: new Map([[1, 2]]) },
		{ name: 'a generator', value: generator() },
		{ name: 'an iterable object', value: spyIterable([1, 2]) },
		{ name: 'an array with its own iterator', value: Object.assign([1, 2], { *[Symbol.iterator]() { yield 3; } }) },
		{ name: 'a map', value: map([1, 2], v => v) }
	])('arrayOf gives nothing for $name', ({ value }) => {
		expect(arrayOf(value as Iterable<unknown>)).toBeUndefined();
	});

});
