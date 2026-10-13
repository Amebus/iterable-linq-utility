import { describe, expect, expectTypeOf, test, vi } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { expectTransformation } from '../_helpers/operationKind';

import {
	collectToArray,
	filter,
	map,
	range,
	tap
} from '@/functions';
import { unit } from '@/types';
import { returnClosesTheIterator, withoutInputIterableThrowsException } from './functionsTestUtility';

describe('map', () => {

	test('map without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(map);
	});

	test.each([
		{ start: 0, end: 20 },
		{ start: -10, end: 10 },
		{ start: 0, end: 20, mapper: undefined },
		{ start: 0, end: 20, mapper: null },
		{ start: 0, end: 20, mapper: {} }
	])('map without mapper -> throw exception', ({ start, end, mapper }) => {
		const mapJs = map as any;
		expect(() => mapJs(range(start, end))).toThrow();
		expect(() => mapJs(range(start, end), mapper)).toThrow();
	});

	test.each([
		{ start: 0, end: 20, mapPredicate: v => range(v), returnValue: 'a value' },
		{ start: 0, end: 20, mapPredicate: v => range(v), returnValue: 123 },
		{ start: 0, end: 20, mapPredicate: v => range(v), returnValue: null },
		{ start: 0, end: 20, mapPredicate: v => range(v) }
	])('map(range($start, $end), $mapPredicate)[Symbol.iterator]().return() closes the iterator', ({ start, end, mapPredicate, returnValue }) => {
		const mapIterable = map(range(start, end), mapPredicate);
		returnClosesTheIterator(mapIterable, returnValue);
	});

	test.each([
		{ start: 0, end: 5, mapPredicate: v => v * 10, expectedPredicateCalls: [5,10,15,20] },
		{ start: -5, end: 5, mapPredicate: v => v * 10, expectedPredicateCalls: [10,20,30,40] },
		{ start: 0, end: 5, mapPredicate: (v, idx) => v * idx, expectedPredicateCalls: [5,10,15,20] },
		{ start: -5, end: 5, mapPredicate: (v, idx) => v * idx, expectedPredicateCalls: [10,20,30,40] }
	])('map(range($start, $end), $mapPredicate) allows re-run', ({ start, end, mapPredicate, expectedPredicateCalls }) => {
		const mapPredicateSpy = vi.fn(mapPredicate);
		const mapped = map(range(start, end), mapPredicateSpy);
		expect(mapPredicateSpy).not.toHaveReturned();

		expectedPredicateCalls
			.forEach(expectedCalls => {
				collectToArray(mapped);
				expect(mapPredicateSpy).toHaveReturnedTimes(expectedCalls);
			});
	});

	test.each([
		{ start: 0, end: 5, mapPredicate: v => v * 10, expectedResult: [0,10,20,30,40] },
		{ start: -5, end: 5, mapPredicate: v => v * 10, expectedResult: [-50,-40,-30,-20,-10,0,10,20,30,40] },
		{ start: 0, end: 5, mapPredicate: (v, idx) => v * idx, expectedResult: [0,1,4,9,16] },
		{ start: -5, end: 5, mapPredicate: (v, idx) => v * idx, expectedResult: [-0, -4, -6, -6, -4, 0, 6, 14, 24, 36] }
	])('map(range($start, $end), $mapPredicate) -> $expectedResult', ({ start, end, mapPredicate, expectedResult }) => {
		const r = collectToArray(map(range(start, end), mapPredicate));
		expect(r).toEqual(expectedResult);
	});

	test('map is transformation', () => {
		expectTransformation(source => map(source, v => v * 10));
	});

	test('return() closes the source', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		const it = map(iterable, v => v)[Symbol.iterator]();
		it.next();
		it.return!();
		expect(state.closed).toBe(true);
	});

	test('a throwing mapper propagates the same error', () => {
		const err = new Error('boom');
		expect(() => collectToArray(map([1], () => { throw err; }))).toThrow(err);
	});

	test('return(value) reaches the original iterator through the chain', () => {
		const originalReturn = vi.fn((v?: unknown) => ({ done: true as const, value: v }));
		const source: Iterable<number> = {
			[Symbol.iterator]: () => {
				let i = 0;
				return { next: () => ({ done: false, value: i++ }), return: originalReturn };
			}
		};
		const it = map(filter(tap(source, () => unit()), () => true), v => v)[Symbol.iterator]();
		it.next();
		expect(it.return!('x')).toEqual({ done: true, value: 'x' });
		expect(originalReturn).toHaveBeenCalledWith('x');
	});

	describe('with a property key', () => {
		const people = [{ name: 'Ann', age: 30 }, { name: 'Bob', age: 25 }];

		test('gives the same values as the equivalent mapper', () => {
			expect(collectToArray(map(people, 'name'))).toEqual(collectToArray(map(people, p => p.name)));
		});

		test('reads the index 0 of a tuple', () => {
			const pairs: [string, number][] = [['a', 1], ['b', 2]];
			expect(collectToArray(map(pairs, 0))).toEqual(['a', 'b']);
		});

		test('reads a symbol key', () => {
			const id = Symbol('id');
			expect(collectToArray(map([{ [id]: 1 }, { [id]: 2 }], id))).toEqual([1, 2]);
		});

		test('reads the properties of the prototype chain and the getters', () => {
			class Person {
				constructor(private readonly first: string, private readonly last: string) {}
				get full(): string {
					return `${this.first} ${this.last}`;
				}
			}
			expect(collectToArray(map([new Set([1, 2]), new Set([3])], 'size'))).toEqual([2, 1]);
			expect(collectToArray(map([new Person('Ann', 'Lee')], 'full'))).toEqual(['Ann Lee']);
		});

		test('a null value throws a TypeError and closes the source', () => {
			const { state, iterable } = closableSource<{ a: number } | null>([{ a: 1 }, null, { a: 3 }]);
			expect(() => collectToArray(map(iterable as Iterable<{ a: number }>, 'a'))).toThrow(TypeError);
			expect(state.closed).toBe(true);
		});

		test('a selector that is neither a function nor a property key throws', () => {
			expect(() => map([1], true as never))
				.toThrow(new Error('[iterable-linq-utility/map] The "mapper" must be a function or a property key'));
		});

		test('gives the type of the property', () => {
			expectTypeOf(map(people, 'name')).toEqualTypeOf<Iterable<string>>();
			expectTypeOf(map(people, 'age')).toEqualTypeOf<Iterable<number>>();
			// @ts-expect-error not a key of the values
			map(people, 'missing');
		});
	});

});
