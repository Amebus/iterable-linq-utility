import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectAction } from '../_helpers/operationKind';

import {
	filter,
	join,
	range
} from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

describe('join', () => {

	test('join without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(join);
	});

	test.each([
		{ values: [], separator: undefined },
		{ values: [1], separator: undefined },
		{ values: [1, 2, 3], separator: undefined },
		{ values: [1, 2, 3], separator: ', ' },
		{ values: [1, 2, 3], separator: '' },
		{ values: ['a', 'b'], separator: '-' },
		{ values: [null, undefined, 1], separator: '-' },
		{ values: [[1, 2], [3]], separator: ';' },
		{ values: [true, { a: 1 }, 1.5], separator: '|' }
	])('join($values, $separator) -> like Array.prototype.join', ({ values, separator }) => {
		expect(join<unknown>(values, separator)).toBe(values.join(separator));
	});

	test('join uses "," without a separator', () => {
		expect(join([1, 2, 3])).toBe('1,2,3');
		expect(join([1, 2, 3], undefined)).toBe('1,2,3');
	});

	test('join converts the values and the separator like Array.prototype.join', () => {
		const value = { toString: () => 'x' };
		expect(join([value, value], 0 as never)).toBe('x0x');
		expect(join([null, undefined])).toBe(',');
	});

	test('join works on a string', () => {
		expect(join('abc', '-')).toBe('a-b-c');
	});

	test('join reads the whole source once', () => {
		const source = spyIterable([1, 2, 3]);
		expect(join(source)).toBe('1,2,3');
		expect(source.stats).toEqual({ iterations: 1, reads: 3 });
	});

	test('join is action', () => {
		expectAction(source => join(source));
	});

	test('join runs again on every call', () => {
		const evens = filter(range(6), v => v % 2 === 0);
		expect(join(evens)).toBe('0,2,4');
		expect(join(evens)).toBe('0,2,4');
	});

	test('join reaches the end of the source', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(join(iterable, ' ')).toBe('1 2 3');
		expect(state.closed).toBe(true);
	});

	test('an error of a value conversion propagates unchanged', () => {
		const error = new Error('toString');
		expect(() => join([{ toString: () => { throw error; } }])).toThrow(error);
	});

	test('a source error propagates unchanged and does not close the source', () => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(2, error);
		expect(() => join(iterable)).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	test('join returns a string', () => {
		expectTypeOf(join([1, 2])).toEqualTypeOf<string>();
	});

});
