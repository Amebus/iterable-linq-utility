import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { expectAction } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('IterableLinq.single', () => {

	test.each([null, 0, {}])('IterableLinq.single rejects invalid predicate %s', predicate => {
		expect(() => IterableLinq.from([1]).single(predicate as never)).toThrow(new Error('[iterable-linq-utility/single] The "predicate" function must be provided'));
	});

	test.each([
		{ start: 0, end: 0, expectedResult: undefined },
		{ start: 3, end: 4, expectedResult: 3 }
	])('IterableLinq.fromRange($start, $end).single() -> $expectedResult', ({ start, end, expectedResult }) => {
		expect(IterableLinq.fromRange(start, end).single()).toBe(expectedResult);
		expect(IterableLinq.fromRange(start, end).single(undefined)).toBe(expectedResult);
	});

	test('IterableLinq.single throws when the chain has more than one value', () => {
		expect(() => IterableLinq.fromRange(0, 2).single()).toThrow(new Error('[iterable-linq-utility/single] The iterable contains more than one value'));
	});

	test.each([
		{ start: 0, end: 5, expectedResult: undefined },
		{ start: 0, end: 6, expectedResult: 5 }
	])('IterableLinq.fromRange($start, $end).single(v => v >= 5) -> $expectedResult', ({ start, end, expectedResult }) => {
		expect(IterableLinq.fromRange(start, end).single(v => v >= 5)).toBe(expectedResult);
	});

	test('IterableLinq.single throws when more than one value satisfies the predicate', () => {
		expect(() => IterableLinq.fromRange(0, 8).single(v => v >= 5)).toThrow(new Error('[iterable-linq-utility/single] More than one value satisfies the predicate'));
	});

	test('IterableLinq.single passes the index and restarts it on every call', () => {
		const indexes: number[] = [];
		const chain = IterableLinq.from(['a', 'b']);
		const predicate = (_: string, index: number) => {
			indexes.push(index);
			return index === 1;
		};
		expect(chain.single(predicate)).toBe('b');
		expect(chain.single(predicate)).toBe('b');
		expect(indexes).toEqual([0, 1, 0, 1]);
	});

	test('IterableLinq.single is action', () => {
		expectAction(source => IterableLinq.from(source).single(v => v === 1));
		expectAction(source => IterableLinq.from(source).take(1).single());
	});

	test('IterableLinq.single terminates on an infinite chain', () => {
		const { stats, iterable } = infiniteSource();
		expect(() => IterableLinq.from(iterable).single()).toThrow(new Error('[iterable-linq-utility/single] The iterable contains more than one value'));
		expect(stats).toEqual({ reads: 2, closed: true });
	});

	test('IterableLinq.single closes the source when the predicate throws', () => {
		const error = new Error('predicate');
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(() => IterableLinq.from(iterable).single(() => { throw error; })).toThrow(error);
		expect(state.closed).toBe(true);
	});

	test('a type guard narrows the result', () => {
		type Item = { kind: 'text'; text: string } | { kind: 'number'; number: number };
		const values: Item[] = [{ kind: 'number', number: 1 }, { kind: 'text', text: 'hello' }];
		const result = IterableLinq.from(values).single((value): value is Extract<Item, { kind: 'text' }> => value.kind === 'text');
		expectTypeOf(result).toEqualTypeOf<Extract<Item, { kind: 'text' }> | undefined>();
		expect(result?.text).toBe('hello');
	});

	test('a boolean predicate keeps the element type', () => {
		const values: (number | string)[] = [1, 'two'];
		const result = IterableLinq.from(values).single((value): boolean => value === 1);
		expectTypeOf(result).toEqualTypeOf<number | string | undefined>();
		expect(result).toBe(1);
		expectTypeOf(() => IterableLinq.from(values).single()).returns.toEqualTypeOf<number | string | undefined>();
	});

});
