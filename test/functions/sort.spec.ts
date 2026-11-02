import { describe, expect, test, vi } from 'vitest';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectTransformation } from '../_helpers/operationKind';

import {
	collectToArray,
	range,
	sort
} from '@/functions';
import { returnClosesTheIterator, withoutInputIterableThrowsException } from './functionsTestUtility';

interface IItem {
	k?: number | null;
	id: string;
}

const ids = (items: Iterable<IItem | null>) => collectToArray(items).map(item => item?.id ?? null);

describe('sort', () => {

	test('sort without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(sort);
	});

	test.each([
		{ returnValue: 'a value' },
		{ returnValue: 123 },
		{ returnValue: null },
		{}
	])('sort(range(20))[Symbol.iterator]().return() closes the iterator', ({ returnValue }) => {
		returnClosesTheIterator(sort(range(20)), returnValue);
	});

	describe('the default comparer', () => {
		test.each([
			{ values: [], expectedResult: [] },
			{ values: [3], expectedResult: [3] },
			{ values: [3, 1, 2], expectedResult: [1, 2, 3] },
			{ values: [10, 9, 1], expectedResult: [1, 9, 10] },
			{ values: ['b', 'B', 'a'], expectedResult: ['B', 'a', 'b'] }
		])('sort($values) -> $expectedResult', ({ values, expectedResult }) => {
			expect(collectToArray(sort<number | string>(values))).toEqual(expectedResult);
		});

		test('descending', () => {
			expect(collectToArray(sort([1, 3, 2], { descending: true }))).toEqual([3, 2, 1]);
		});

		test('infinite numbers', () => {
			expect(collectToArray(sort([Infinity, 1, -Infinity, Infinity, 0]))).toEqual([-Infinity, 0, 1, Infinity, Infinity]);
			expect(collectToArray(sort([Infinity, 1, -Infinity], { descending: true }))).toEqual([Infinity, 1, -Infinity]);
		});

		test('descending strings', () => {
			expect(collectToArray(sort(['b', 'B', 'a'], { descending: true }))).toEqual(['b', 'a', 'B']);
		});

		test('empty options sort ascending', () => {
			expect(collectToArray(sort([1, 3, 2], {}))).toEqual([1, 2, 3]);
		});

		test('null, undefined and NaN go last, in source order, in both directions', () => {
			const values = [2, null, 1, undefined, NaN, 0];
			expect(collectToArray(sort(values))).toEqual([0, 1, 2, null, undefined, NaN]);
			expect(collectToArray(sort(values, { descending: true }))).toEqual([2, 1, 0, null, undefined, NaN]);
		});
	});

	describe('a key', () => {
		const items: IItem[] = [{ k: 1, id: 'a' }, { k: 0, id: 'b' }, { k: 1, id: 'c' }, { k: 0, id: 'd' }];

		test('is stable, in both directions', () => {
			expect(ids(sort(items, 'k'))).toEqual(['b', 'd', 'a', 'c']);
			expect(ids(sort(items, 'k', { descending: true }))).toEqual(['a', 'c', 'b', 'd']);
		});

		test('string keys, and infinite keys', () => {
			const words = [{ w: 'pear' }, { w: 'Apple' }, { w: 'fig' }];
			expect(collectToArray(sort(words, 'w')).map(x => x.w)).toEqual(['Apple', 'fig', 'pear']);
			expect(collectToArray(sort(words, 'w', { descending: true })).map(x => x.w)).toEqual(['pear', 'fig', 'Apple']);
			const infinite = [{ k: Infinity, id: 'a' }, { k: -Infinity, id: 'b' }, { k: Infinity, id: 'c' }, { k: 0, id: 'd' }];
			expect(ids(sort(infinite, 'k'))).toEqual(['b', 'd', 'a', 'c']);
		});

		test('the missing keys and the null elements go last, in source order, in both directions', () => {
			const values: (IItem | null)[] = [{ k: 2, id: 'a' }, { id: 'b' }, null, { k: NaN, id: 'c' }, { k: 1, id: 'd' }, { k: null, id: 'e' }];
			expect(ids(sort(values, 'k' as never))).toEqual(['d', 'a', 'b', null, 'c', 'e']);
			expect(ids(sort(values, 'k' as never, { descending: true }))).toEqual(['a', 'd', 'b', null, 'c', 'e']);
		});
	});

	describe('a list of keys', () => {
		test('the next key breaks the ties, in both directions', () => {
			const values = [{ g: 1, v: 2 }, { g: 0, v: 9 }, { g: 1, v: 1 }];
			expect(collectToArray(sort(values, ['g', 'v']))).toEqual([{ g: 0, v: 9 }, { g: 1, v: 1 }, { g: 1, v: 2 }]);
			expect(collectToArray(sort(values, ['g', 'v'], { descending: true }))).toEqual([{ g: 1, v: 2 }, { g: 1, v: 1 }, { g: 0, v: 9 }]);
		});

		test('a missing key goes after the present ones at its level', () => {
			const values: { g?: number; v?: number }[] = [{ g: 1 }, { v: 1 }, { g: 0, v: 5 }, { g: 1, v: 3 }, { g: 0 }, { v: 0 }];
			const expected = [{ g: 0, v: 5 }, { g: 0 }, { g: 1, v: 3 }, { g: 1 }, { v: 0 }, { v: 1 }];
			expect(collectToArray(sort(values, ['g', 'v']))).toEqual(expected);
			expect(collectToArray(sort(values, ['g', 'v'], { descending: true }))).toEqual([{ g: 1, v: 3 }, { g: 1 }, { g: 0, v: 5 }, { g: 0 }, { v: 1 }, { v: 0 }]);
		});

		test('is stable, in both directions', () => {
			const values = [{ g: 1, v: 1, id: 'a' }, { g: 0, v: 1, id: 'b' }, { g: 1, v: 1, id: 'c' }, { g: 0, v: 1, id: 'd' }];
			expect(collectToArray(sort(values, ['g', 'v'])).map(x => x.id)).toEqual(['b', 'd', 'a', 'c']);
			expect(collectToArray(sort(values, ['g', 'v'], { descending: true })).map(x => x.id)).toEqual(['a', 'c', 'b', 'd']);
		});

		test('a list of one key sorts like the key', () => {
			const values = [{ k: 2 }, { k: 1 }, {}, { k: 3 }];
			expect(collectToArray(sort(values, ['k']))).toEqual(collectToArray(sort(values, 'k')));
		});

		test('three keys, in both directions', () => {
			const values = [{ a: 1, b: 1, c: 2 }, { a: 0, b: 2, c: 0 }, { a: 1, b: 1, c: 1 }, { a: 1, b: 0, c: 9 }];
			expect(collectToArray(sort(values, ['a', 'b', 'c']))).toEqual([{ a: 0, b: 2, c: 0 }, { a: 1, b: 0, c: 9 }, { a: 1, b: 1, c: 1 }, { a: 1, b: 1, c: 2 }]);
			expect(collectToArray(sort(values, ['a', 'b', 'c'], { descending: true }))).toEqual([{ a: 1, b: 1, c: 2 }, { a: 1, b: 1, c: 1 }, { a: 1, b: 0, c: 9 }, { a: 0, b: 2, c: 0 }]);
			const tied = [{ a: 1, b: 1, c: 1, id: 'x' }, { a: 1, b: 1, c: 1, id: 'y' }];
			expect(collectToArray(sort(tied, ['a', 'b', 'c'])).map(v => v.id)).toEqual(['x', 'y']);
		});

		test('equal infinite keys fall through to the next key', () => {
			const values = [{ g: Infinity, v: 2 }, { g: -Infinity, v: 5 }, { g: Infinity, v: 1 }, { g: -Infinity, v: 4 }];
			expect(collectToArray(sort(values, ['g', 'v']))).toEqual([{ g: -Infinity, v: 4 }, { g: -Infinity, v: 5 }, { g: Infinity, v: 1 }, { g: Infinity, v: 2 }]);
		});

		test('string and number keys together', () => {
			const values = [{ name: 'b', n: 2 }, { name: 'a', n: 9 }, { name: 'b', n: 1 }];
			expect(collectToArray(sort(values, ['name', 'n']))).toEqual([{ name: 'a', n: 9 }, { name: 'b', n: 1 }, { name: 'b', n: 2 }]);
			expect(collectToArray(sort(values, ['name', 'n'], { descending: true }))).toEqual([{ name: 'b', n: 2 }, { name: 'b', n: 1 }, { name: 'a', n: 9 }]);
		});

		test('with missing keys the equal values keep the source order', () => {
			const values = [{ g: 1, id: 'a' }, { g: 0, v: 1, id: 'b' }, { g: 1, id: 'c' }];
			expect(collectToArray(sort(values, ['g', 'v'] as never)).map((x: { id: string }) => x.id)).toEqual(['b', 'a', 'c']);
		});

		test('equal dates are a tie, also when a key is missing', () => {
			const values = [{ d: new Date(1), n: 'b' }, { d: new Date(1), n: 'a' }, { d: null, n: 'c' }];
			expect(collectToArray(sort(values, ['d', 'n'] as never)).map((x: { n: string }) => x.n)).toEqual(['a', 'b', 'c']);
			expect(collectToArray(sort(values.slice(0, 2), ['d', 'n'])).map(x => x.n)).toEqual(['a', 'b']);
		});

		test('a null element goes last', () => {
			const values = [{ g: 1, v: 1 }, null, { g: 0, v: 1 }];
			expect(collectToArray(sort(values, ['g', 'v'] as never))).toEqual([{ g: 0, v: 1 }, { g: 1, v: 1 }, null]);
		});
	});

	describe('a compare function', () => {
		const byK = (x: IItem, y: IItem) => (x.k as number) - (y.k as number);
		const items: IItem[] = [{ k: 1, id: 'a' }, { k: 0, id: 'b' }, { k: 1, id: 'c' }, { k: 0, id: 'd' }];

		test('is stable, and decides the direction itself', () => {
			expect(ids(sort(items, byK))).toEqual(['b', 'd', 'a', 'c']);
			expect(ids(sort(items, (x, y) => byK(y, x)))).toEqual(['a', 'c', 'b', 'd']);
		});

		test('undefined elements go last, without calling the function', () => {
			const compare = vi.fn((a: number, b: number) => a - b);
			expect(collectToArray(sort([2, undefined as unknown as number, 1], compare))).toEqual([1, 2, undefined]);
			expect(compare.mock.calls.flat()).not.toContain(undefined);
		});

		test.each([[[]], [[1]]])('is not called for %j', values => {
			const compare = vi.fn(() => 0);
			collectToArray(sort(values, compare));
			expect(compare).not.toHaveBeenCalled();
		});

		test('an error propagates as the same object, the iterator is done, a new run sorts again', () => {
			const error = new Error('boom');
			const sorted = sort([2, 1], () => {
				throw error;
			});
			const it = sorted[Symbol.iterator]();
			expect(() => it.next()).toThrow(error);
			expect(it.next()).toEqual({ done: true, value: undefined });
			expect(() => collectToArray(sorted)).toThrow(error);
		});
	});

	test('sort is transformation', () => {
		expectTransformation(source => sort(source));
	});

	test('sort allows re-run, reading the source again', () => {
		const source = spyIterable([3, 1, 2]);
		const sorted = sort(source);
		expect(collectToArray(sorted)).toEqual([1, 2, 3]);
		expect(collectToArray(sorted)).toEqual([1, 2, 3]);
		expect(source.stats.reads).toBe(6);
	});

	test('sort reads the whole source before the first value', () => {
		const source = spyIterable([5, 4, 3, 2, 1]);
		const it = sort(source)[Symbol.iterator]();
		expect(it.next().value).toBe(1);
		expect(source.stats.reads).toBe(5);
	});

	test('sort does not change an array source', () => {
		const values = [3, 1, 2];
		collectToArray(sort(values));
		expect(values).toEqual([3, 1, 2]);
	});

	test('an error of the source propagates on the first read, without closing it', () => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(2, error);
		const it = sort(iterable)[Symbol.iterator]();
		expect(() => it.next()).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	describe('validation, at the call', () => {
		test.each([null, [], [{}], true])('rejects the comparer %j', comparer => {
			expect(() => sort([1], comparer as never))
				.toThrow(new Error('[iterable-linq-utility/sort] The "comparer" must be a function, a property key or a list of property keys'));
		});

		test.each([
			{ name: 'undefined', comparer: undefined },
			{ name: 'options', comparer: {} }
		])('rejects $name before options', ({ comparer }) => {
			expect(() => sort([1], comparer as never, { descending: true }))
				.toThrow(new Error('[iterable-linq-utility/sort] The "comparer" must be a function, a property key or a list of property keys'));
		});

		test('rejects options after a compare function', () => {
			expect(() => sort([1], ((a: number, b: number) => a - b) as never, { descending: true }))
				.toThrow(new Error('[iterable-linq-utility/sort] The "options" cannot be given with a compare function, which decides the order'));
		});

		test('rejects options that are not an object', () => {
			expect(() => sort([1], 'k' as never, 'x' as never))
				.toThrow(new Error('[iterable-linq-utility/sort] The "options" parameter must be an object'));
		});

		test('rejects a descending option that is not a boolean', () => {
			expect(() => sort([1], { descending: 1 as never }))
				.toThrow(new Error('[iterable-linq-utility/sort] The "descending" option must be a boolean'));
			expect(() => sort([1], 'k' as never, { descending: 'yes' as never }))
				.toThrow(new Error('[iterable-linq-utility/sort] The "descending" option must be a boolean'));
		});
	});
});
