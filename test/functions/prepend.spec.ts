import { describe, expect, test, vi } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectTransformation } from '../_helpers/operationKind';

import {
	collectToArray,
	prepend,
	range,
	take
} from '@/functions';
import { returnClosesTheIterator, withoutInputIterableThrowsException } from './functionsTestUtility';

describe('prepend', () => {

	test('prepend without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(prepend);
	});

	test.each([
		{ end: 20, returnValue: 'a value' },
		{ end: 20, returnValue: 123 },
		{ end: 20, returnValue: null },
		{ end: 1 },
		{ end: 0 }
	])('prepend(range($end), 99)[Symbol.iterator]().return() closes the iterator', ({ end, returnValue }) => {
		returnClosesTheIterator(prepend(range(end), 99), returnValue);
	});

	test.each([
		{ values: [], value: 9, expectedResult: [9] },
		{ values: [1], value: 9, expectedResult: [9, 1] },
		{ values: [1, 2, 3], value: 9, expectedResult: [9, 1, 2, 3] },
		{ values: [1, 2, 3], value: undefined, expectedResult: [undefined, 1, 2, 3] }
	])('prepend($values, $value) -> $expectedResult', ({ values, value, expectedResult }) => {
		expect(collectToArray(prepend<number | undefined>(values, value))).toEqual(expectedResult);
	});

	test('prepend is transformation', () => {
		expectTransformation(source => prepend(source, 0));
	});

	test('prepend allows re-run', () => {
		const prepended = prepend(range(3), 9);
		expect(collectToArray(prepended)).toEqual([9, 0, 1, 2]);
		expect(collectToArray(prepended)).toEqual([9, 0, 1, 2]);
	});

	test('prepend yields the value before reading the source', () => {
		const source = spyIterable([1, 2]);
		const it = prepend(source, 9)[Symbol.iterator]();
		expect(it.next()).toEqual({ done: false, value: 9 });
		expect(source.stats.reads).toBe(0);
		expect(it.next()).toEqual({ done: false, value: 1 });
		expect(it.next()).toEqual({ done: false, value: 2 });
		expect(it.next().done).toBe(true);
		expect(it.next().done).toBe(true);
	});

	test('prepend works on an infinite source cut by take', () => {
		const { stats, iterable } = infiniteSource();
		expect(collectToArray(take(prepend(iterable, -1), 3))).toEqual([-1, 0, 1]);
		expect(stats).toEqual({ reads: 2, closed: true });
	});

	test('return() after the value closes the source, before it is read', () => {
		// a generator not started yet skips its finally when closed: spy on return() instead
		const returnSpy = vi.fn(() => ({ done: true as const, value: undefined }));
		const iterable = { [Symbol.iterator]: () => ({ next: () => ({ done: false, value: 1 }), return: returnSpy }) };
		const it = prepend(iterable, 9)[Symbol.iterator]();
		it.next();
		it.return!();
		expect(returnSpy).toHaveBeenCalledOnce();
	});

	test('return() closes the source', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		const it = prepend(iterable, 9)[Symbol.iterator]();
		it.next();
		it.next();
		it.return!();
		expect(state.closed).toBe(true);
	});

	test('an error of the source propagates and does not close it', () => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(1, error);
		const it = prepend(iterable, 9)[Symbol.iterator]();
		expect(it.next().value).toBe(9);
		expect(() => it.next()).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

});
