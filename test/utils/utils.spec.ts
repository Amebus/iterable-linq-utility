import { describe, expect, test } from 'vitest';
import { spyIterable } from '../_helpers/generators/spyIterable';

import { isPlainArray, isPlainSet } from '@/utils';

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
