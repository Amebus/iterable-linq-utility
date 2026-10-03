import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { expectAction } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';
import { withoutInputFunctionThrowsException } from './linqIterableWrapperTestUtility';

describe('IterableLinq.findLast', () => {

	test('IterableLinq.findLast without predicate -> throw exception', () => {
		withoutInputFunctionThrowsException(IterableLinq.fromRange(0, 20), 'findLast');
	});

	test.each([
		{ start: 0, end: 0, expectedResult: undefined },
		{ start: 0, end: 5, expectedResult: 4 },
		{ start: 5, end: 8, expectedResult: undefined }
	])('IterableLinq.fromRange($start, $end).findLast(v => v < 5) -> $expectedResult', ({ start, end, expectedResult }) => {
		expect(IterableLinq.fromRange(start, end).findLast(v => v < 5)).toBe(expectedResult);
	});

	test('IterableLinq.findLast passes the index and restarts it on every call', () => {
		const indexes: number[] = [];
		const chain = IterableLinq.from(['a', 'b', 'c']);
		const predicate = (_: string, index: number) => {
			indexes.push(index);
			return index < 2;
		};
		expect(chain.findLast(predicate)).toBe('b');
		expect(chain.findLast(predicate)).toBe('b');
		expect(indexes).toEqual([0, 1, 2, 0, 1, 2]);
	});

	test('IterableLinq.findLast is action', () => {
		expectAction(source => IterableLinq.from(source).findLast(v => v > 1));
	});

	test('IterableLinq.findLast closes the source when the predicate throws', () => {
		const error = new Error('predicate');
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(() => IterableLinq.from(iterable).findLast(() => { throw error; })).toThrow(error);
		expect(state.closed).toBe(true);
	});

	test('a type guard narrows the result', () => {
		type Item = { kind: 'text'; text: string } | { kind: 'number'; number: number };
		const values: Item[] = [{ kind: 'text', text: 'first' }, { kind: 'text', text: 'last' }, { kind: 'number', number: 1 }];
		const result = IterableLinq.from(values).findLast((value): value is Extract<Item, { kind: 'text' }> => value.kind === 'text');
		expectTypeOf(result).toEqualTypeOf<Extract<Item, { kind: 'text' }> | undefined>();
		expect(result?.text).toBe('last');
	});

	test('a boolean predicate keeps the element type', () => {
		const values: (number | string)[] = [1, 'two'];
		const result = IterableLinq.from(values).findLast((value): boolean => value === 1);
		expectTypeOf(result).toEqualTypeOf<number | string | undefined>();
		expect(result).toBe(1);
	});

});
