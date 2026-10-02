import { describe, expect, test, vi } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectTransformation } from '../_helpers/operationKind';

import { collectToArray, skip, take } from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

describe('skip', () => {

	test('rejects a missing or invalid source', () => {
		withoutInputIterableThrowsException(skip);
		expect(() => skip({} as any, 0)).toThrow(Error);
	});

	test.each([-1, 2.5, NaN, Infinity, -Infinity, undefined, null, '2', {}, true])('rejects count %s', count => {
		expect(() => skip([1, 2], count as any)).toThrow('The "count" parameter must be a non-negative integer');
	});

	test.each([
		{ values: [], count: 0, expected: [] },
		{ values: [], count: 3, expected: [] },
		{ values: [1, 2, 3, 4, 5], count: 0, expected: [1, 2, 3, 4, 5] },
		{ values: [1, 2, 3, 4, 5], count: 1, expected: [2, 3, 4, 5] },
		{ values: [1, 2, 3, 4, 5], count: 3, expected: [4, 5] },
		{ values: [1, 2, 3, 4, 5], count: 5, expected: [] },
		{ values: [1, 2, 3, 4, 5], count: 10, expected: [] }
	])('skip($values, $count) -> $expected', ({ values, count, expected }) => {
		expect(collectToArray(skip(values, count))).toEqual(expected);
	});

	test('is a lazy, re-runnable Transformation', () => {
		expectTransformation(source => skip(source, 2));
	});

	test('iterator creation does not read values; next reads only what it needs', () => {
		const source = spyIterable([0, 1, 2, 3, 4]);
		const it = skip(source, 2)[Symbol.iterator]();
		expect(source.stats.reads).toBe(0);
		expect(it.next().value).toBe(2);
		expect(source.stats.reads).toBe(3);
		expect(it.next().value).toBe(3);
		expect(source.stats.reads).toBe(4);
	});

	test('keeps iterator counters independent', () => {
		const result = skip([0, 1, 2, 3], 2);
		const first = result[Symbol.iterator]();
		const second = result[Symbol.iterator]();
		expect(first.next().value).toBe(2);
		expect(first.next().value).toBe(3);
		expect(second.next().value).toBe(2);
		expect(second.next().value).toBe(3);
		expect(collectToArray(result)).toEqual([2, 3]);
	});

	test('reads exactly five values from an infinite source for skip(3), take(2)', () => {
		const { stats, iterable } = infiniteSource(5);
		expect(collectToArray(take(skip(iterable, 3), 2))).toEqual([3, 4]);
		expect(stats.reads).toBe(5);
	});

	test('consumer early stop closes the source', () => {
		const { state, iterable } = closableSource([0, 1, 2, 3]);
		for (const value of skip(iterable, 2)) {
			expect(value).toBe(2);
			break;
		}
		expect(state.closed).toBe(true);
	});

	test.each([false, true])('return forwards its value and closes once, started=%s', started => {
		const next = vi.fn(() => ({ done: false as const, value: 1 }));
		const close = vi.fn(() => ({ done: true as const, value: undefined }));
		const it = skip({ [Symbol.iterator]: () => ({ next, return: close }) }, 2)[Symbol.iterator]();
		if (started)
			it.next();
		const reads = next.mock.calls.length;
		expect(it.return!('closed')).toEqual({ done: true, value: 'closed' });
		it.return!();
		expect(close).toHaveBeenCalledExactlyOnceWith('closed');
		expect(it.next().done).toBe(true);
		expect(next).toHaveBeenCalledTimes(reads);
	});

	test.each([0, 1, 3])('stays done after exhaustion with count %s', count => {
		const next = vi.fn().mockReturnValueOnce({ done: false, value: 1 }).mockReturnValue({ done: true, value: undefined });
		const close = vi.fn();
		const it = skip({ [Symbol.iterator]: () => ({ next, return: close }) }, count)[Symbol.iterator]();
		while (!it.next().done) { /* consume the single value */ }
		expect(next).toHaveBeenCalledTimes(2);
		it.next();
		it.next();
		it.return!();
		expect(next).toHaveBeenCalledTimes(2);
		expect(close).not.toHaveBeenCalled();
	});

	test.each([1, 3])('propagates a source error at read %s without closing it', failAt => {
		const error = new Error('source error');
		const { returnSpy, iterable } = throwingSource(failAt, error);
		expect(() => skip(iterable, 2)[Symbol.iterator]().next()).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

});
