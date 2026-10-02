import { describe, expect, expectTypeOf, test, vi } from 'vitest';
import { expectTransformation } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';
import { withoutInputFunctionThrowsException } from './linqIterableWrapperTestUtility';

describe('IterableLinq.filter', () => {

	test('a type guard narrows mixed values', () => {
		const values: (number | string)[] = [1, 'two', 3, 'four'];
		const result = IterableLinq.from(values).filter((value): value is string => typeof value === 'string');
		expectTypeOf(result).toEqualTypeOf<IterableLinq.IIterableLinq<string>>();
		expect(result.collectToArray()).toEqual(['two', 'four']);
	});

	test('a type guard narrows a discriminated union for map', () => {
		type Item = { kind: 'text'; text: string } | { kind: 'number'; number: number };
		const values: Item[] = [{ kind: 'text', text: 'hello' }, { kind: 'number', number: 1 }];
		const result = IterableLinq.from(values).filter((value): value is Extract<Item, { kind: 'text' }> => value.kind === 'text');
		expectTypeOf(result).toEqualTypeOf<IterableLinq.IIterableLinq<Extract<Item, { kind: 'text' }>>>();
		const texts = result.map(value => value.text).collectToArray();
		expectTypeOf(texts).toEqualTypeOf<string[]>();
		expect(texts).toEqual(['hello']);
	});

	test('a type guard removes null and undefined', () => {
		const values: (string | null | undefined)[] = ['one', null, undefined];
		const result = IterableLinq.from(values).filter((value): value is string => value != null);
		expectTypeOf(result).toEqualTypeOf<IterableLinq.IIterableLinq<string>>();
		expect(result.collectToArray()).toEqual(['one']);
	});

	test('a boolean predicate preserves the source type', () => {
		const values: (number | string)[] = [1, 'two'];
		const result = IterableLinq.from(values).filter((value): boolean => typeof value === 'string');
		expectTypeOf(result).toEqualTypeOf<IterableLinq.IIterableLinq<number | string>>();
		expect(result.collectToArray()).toEqual(['two']);
	});

	test('a type guard receives source indexes lazily on every run', () => {
		const values: (number | string)[] = [1, 'two', 3, 'four'];
		const indexes: number[] = [];
		const result = IterableLinq.from(values).filter((value, index): value is string => {
			expectTypeOf(value).toEqualTypeOf<number | string>();
			expectTypeOf(index).toEqualTypeOf<number>();
			indexes.push(index);
			return typeof value === 'string' && index > 1;
		});
		expect(indexes).toEqual([]);
		expect(result.collectToArray()).toEqual(['four']);
		expect(result.collectToArray()).toEqual(['four']);
		expect(indexes).toEqual([0, 1, 2, 3, 0, 1, 2, 3]);
	});

	test.each([
		{ start: 0, end: 20 },
		{ start: -10, end: 10 }
	])('IterableLinq.filter without filter predicate -> throw exception', ({ start, end }) => {
		withoutInputFunctionThrowsException(IterableLinq.fromRange(start, end), 'filter');
	});

	test.each([
		{ start: 0, end: 0, filterPredicate: v => v % 2 === 0, expectedPredicateCalls: [0,0,0,0] },
		{ start: 0, end: 20, filterPredicate: v => v % 2 === 0, expectedPredicateCalls: [20,40,60,80] },
		{ start: 0, end: 20, filterPredicate: v => v % 2 === 1, expectedPredicateCalls: [20,40,60,80] },
		{ start: -10, end: 10, filterPredicate: v => v > -5 && v < 5, expectedPredicateCalls: [20,40,60,80] },
		{ start: 0, end: 20, filterPredicate: (v, idx) => v % 2 === 0 && idx < 10, expectedPredicateCalls: [20,40,60,80] },
		{ start: 0, end: 20, filterPredicate: (v, idx) => v % 2 === 1 && idx > 10, expectedPredicateCalls: [20,40,60,80] },
		{ start: -10, end: 10, filterPredicate: (v, idx) => v > -5 && v < 5 && idx === 0, expectedPredicateCalls: [20,40,60,80] }
	])('IterableLinq.fromRange($start, $end).filter($filterPredicate) allows re-run', ({ start, end, filterPredicate, expectedPredicateCalls }) => {
		const filterPredicateSpy = vi.fn(filterPredicate);
		const filtered = IterableLinq
			.fromRange(start, end)
			.filter(filterPredicateSpy);
		expect(filterPredicateSpy).not.toHaveBeenCalled();

		expectedPredicateCalls
			.forEach(expectedCalls => {
				filtered.collectToArray();
				expect(filterPredicateSpy).toHaveReturnedTimes(expectedCalls);
			});
	});

	test.each([
		{ start: 0, end: 0, filterPredicate: v => v % 2 === 0, expectedResult: [] },
		{ start: 0, end: 20, filterPredicate: v => v % 2 === 0, expectedResult: [0,2,4,6,8,10,12,14,16,18] },
		{ start: 0, end: 20, filterPredicate: v => v % 2 === 1, expectedResult: [1,3,5,7,9,11,13,15,17,19] },
		{ start: -10, end: 10, filterPredicate: v => v > -5 && v < 5, expectedResult: [-4,-3,-2,-1,0,1,2,3,4] },
		{ start: 0, end: 20, filterPredicate: (v, idx) => v % 2 === 0 && idx < 10, expectedResult: [0,2,4,6,8] },
		{ start: 0, end: 20, filterPredicate: (v, idx) => v % 2 === 1 && idx > 10, expectedResult: [11,13,15,17,19] },
		{ start: -10, end: 10, filterPredicate: (v, idx) => v > -5 && v < 5 && idx === 0, expectedResult: [] }
	])('IterableLinq.fromRange($start, $end).filter($filterPredicate) -> $expectedResult', ({ start, end, filterPredicate, expectedResult }) => {
		const r = IterableLinq
			.fromRange(start, end)
			.filter(filterPredicate)
			.collectToArray();
		expect(r).toEqual(expectedResult);
	});

	test('IterableLinq.filter is transformation', () => {
		expectTransformation(source => IterableLinq.from(source).filter(v => v % 2 === 0));
	});

});
