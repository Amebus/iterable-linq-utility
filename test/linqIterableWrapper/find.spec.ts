import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { expectAction } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';
import { withoutInputFunctionThrowsException } from './linqIterableWrapperTestUtility';

describe('IterableLinq.find', () => {

	test('IterableLinq.find without predicate -> throw exception', () => {
		withoutInputFunctionThrowsException(IterableLinq.fromRange(0, 20), 'find');
	});

	test.each([
		{ start: 0, end: 0, expectedResult: undefined },
		{ start: 0, end: 5, expectedResult: undefined },
		{ start: 0, end: 8, expectedResult: 5 },
		{ start: 6, end: 8, expectedResult: 6 }
	])('IterableLinq.fromRange($start, $end).find(v => v >= 5) -> $expectedResult', ({ start, end, expectedResult }) => {
		expect(IterableLinq.fromRange(start, end).find(v => v >= 5)).toBe(expectedResult);
	});

	test('IterableLinq.find passes the index and restarts it on every call', () => {
		const indexes: number[] = [];
		const chain = IterableLinq.from(['a', 'b', 'c']);
		const predicate = (_: string, index: number) => {
			indexes.push(index);
			return index === 1;
		};
		expect(chain.find(predicate)).toBe('b');
		expect(chain.find(predicate)).toBe('b');
		expect(indexes).toEqual([0, 1, 0, 1]);
	});

	test('IterableLinq.find is action', () => {
		expectAction(source => IterableLinq.from(source).find(v => v > 1));
	});

	test('IterableLinq.find terminates on an infinite chain with a match', () => {
		const { stats, iterable } = infiniteSource();
		expect(IterableLinq.from(iterable).find(v => v === 3)).toBe(3);
		expect(stats).toEqual({ reads: 4, closed: true });
	});

	test('IterableLinq.find closes the source when the predicate throws', () => {
		const error = new Error('predicate');
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(() => IterableLinq.from(iterable).find(() => { throw error; })).toThrow(error);
		expect(state.closed).toBe(true);
	});

	test('a type guard narrows the result', () => {
		type Item = { kind: 'text'; text: string } | { kind: 'number'; number: number };
		const values: Item[] = [{ kind: 'number', number: 1 }, { kind: 'text', text: 'hello' }];
		const result = IterableLinq.from(values).find((value): value is Extract<Item, { kind: 'text' }> => value.kind === 'text');
		expectTypeOf(result).toEqualTypeOf<Extract<Item, { kind: 'text' }> | undefined>();
		expect(result?.text).toBe('hello');
	});

	test('a boolean predicate keeps the element type', () => {
		const values: (number | string)[] = [1, 'two'];
		const result = IterableLinq.from(values).find((value): boolean => value === 1);
		expectTypeOf(result).toEqualTypeOf<number | string | undefined>();
		expect(result).toBe(1);
	});

});
