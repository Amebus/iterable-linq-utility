import { describe, expect, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectTransformation } from '../_helpers/operationKind';

import {
	append,
	collectToArray,
	range,
	take
} from '@/functions';
import { returnClosesTheIterator, withoutInputIterableThrowsException } from './functionsTestUtility';

describe('append', () => {

	test('append without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(append);
	});

	test.each([
		{ end: 20, returnValue: 'a value' },
		{ end: 20, returnValue: 123 },
		{ end: 20, returnValue: null },
		{ end: 1 },
		{ end: 0 }
	])('append(range($end), 99)[Symbol.iterator]().return() closes the iterator', ({ end, returnValue }) => {
		returnClosesTheIterator(append(range(end), 99), returnValue);
	});

	test.each([
		{ values: [], value: 9, expectedResult: [9] },
		{ values: [1], value: 9, expectedResult: [1, 9] },
		{ values: [1, 2, 3], value: 9, expectedResult: [1, 2, 3, 9] },
		{ values: [1, 2, 3], value: undefined, expectedResult: [1, 2, 3, undefined] }
	])('append($values, $value) -> $expectedResult', ({ values, value, expectedResult }) => {
		expect(collectToArray(append<number | undefined>(values, value))).toEqual(expectedResult);
	});

	test('append is transformation', () => {
		expectTransformation(source => append(source, 6));
	});

	test('append allows re-run', () => {
		const appended = append(range(3), 9);
		expect(collectToArray(appended)).toEqual([0, 1, 2, 9]);
		expect(collectToArray(appended)).toEqual([0, 1, 2, 9]);
	});

	test('append yields the value after the source ends', () => {
		const it = append([1], 9)[Symbol.iterator]();
		expect(it.next()).toEqual({ done: false, value: 1 });
		expect(it.next()).toEqual({ done: false, value: 9 });
		expect(it.next().done).toBe(true);
		expect(it.next().done).toBe(true);
	});

	test('append works on an infinite source cut by take', () => {
		const { stats, iterable } = infiniteSource();
		expect(collectToArray(take(append(iterable, -1), 3))).toEqual([0, 1, 2]);
		expect(stats).toEqual({ reads: 3, closed: true });
	});

	test('return() closes the source', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		const it = append(iterable, 9)[Symbol.iterator]();
		it.next();
		it.return!();
		expect(state.closed).toBe(true);
	});

	test('an error of the source propagates and does not close it', () => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(2, error);
		const it = append(iterable, 9)[Symbol.iterator]();
		expect(it.next().value).toBe(1);
		expect(() => it.next()).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

});
