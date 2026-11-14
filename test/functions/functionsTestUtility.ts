import { expect, vi } from 'vitest';
import { throwingSource } from '../_helpers/generators/throwingSource';

import { materialize, memoize } from '@/functions';

export function returnClosesTheIterator<T>(iterable: Iterable<T>, returnValue: any) {
	const iterator = iterable[Symbol.iterator]();
	const r = iterator.return!(returnValue);
	expect(r).toEqual({ done: true, value: returnValue });
	const next = iterator.next();
	expect(next.done).toBe(true);

	const iterator2 = iterable[Symbol.iterator]();
	iterator2.next();
	iterator2.next();
	const r2 = iterator2.return!(returnValue);
	expect(r2).toEqual({ done: true, value: returnValue });
	const next2 = iterator2.next();
	expect(next2.done).toBe(true);

	const iterator3 = iterable[Symbol.iterator]();
	iterator3.next();
	iterator3.next();
	iterator3.next();
	const r3 = iterator3.return!(returnValue);
	expect(r3).toEqual({ done: true, value: returnValue });
	const next3 = iterator3.next();
	expect(next3.done).toBe(true);
}

// the error names the operation: the name of the raw function, or `operation` when it is exported under another name
export function withoutInputIterableThrowsException(fn: any, operation: string = fn.name) {
	const error = new Error(`[iterable-linq-utility/${operation}] The "iterable" must be provided`);
	expect(() => fn()).toThrow(error);
	expect(() => fn(undefined)).toThrow(error);
	expect(() => fn(null)).toThrow(error);
}

export async function withoutInputIterableThrowsExceptionAsync(fn: any) {
	const prefix = `[iterable-linq-utility/${fn.name}] `;
	await expect(() => fn()).rejects.toThrow(prefix);
	await expect(() => fn(undefined)).rejects.toThrow(prefix);
	await expect(() => fn(null)).rejects.toThrow(prefix);
}

/**
 * Runs `action` with the built-in iterator of `prototype` replaced by a spy, and checks that the action never calls it: the
 * Action reads an array, a `Set` or a `Map` without iterating it (ADR 0036, 0037).
 */
export function expectNoIteration<R>(prototype: typeof Array.prototype | typeof Set.prototype | typeof Map.prototype, action: () => R): R {
	const iterator = vi.spyOn(prototype as any, Symbol.iterator as any);
	try {
		const result = action();
		expect(iterator).not.toHaveBeenCalled();
		return result;
	} finally {
		iterator.mockRestore();
	}
}

/**
 * Runs `action` with the `[Symbol.iterator]` of `iterable` replaced by a spy, and checks whether the action calls it.
 */
function spyIteration<T, R>(iterable: Iterable<T>, iterated: boolean, action: () => R): R {
	const iterator = vi.spyOn(iterable as any, Symbol.iterator as any);
	try {
		const result = action();
		if (iterated)
			expect(iterator).toHaveBeenCalled();
		else
			expect(iterator).not.toHaveBeenCalled();
		return result;
	} finally {
		iterator.mockRestore();
	}
}

/**
 * Checks that `action` reads `iterable` without calling its `[Symbol.iterator]`: the Action reads the values of a `memoize` or a
 * `materialize` as an array (ADR 0038).
 */
export function expectNoIterationOf<T, R>(iterable: Iterable<T>, action: () => R): R {
	return spyIteration(iterable, false, action);
}

/**
 * Checks that `action` reads `iterable` through its `[Symbol.iterator]`.
 */
export function expectIterationOf<T, R>(iterable: Iterable<T>, action: () => R): R {
	return spyIteration(iterable, true, action);
}

/**
 * The iterables whose values an Action reads as an array (ADR 0038): a `materialize`, a full `memoize` not read yet, and a
 * partial `memoize` read to the end.
 */
export function storedSources(): { name: string; create: <T>(values: readonly T[]) => Iterable<T> }[] {
	return [
		{ name: 'a materialize', create: values => materialize(values) },
		{ name: 'a full memoize', create: values => memoize(values, { allowPartialMemoization: false }) },
		{
			name: 'a finished partial memoize',
			create: <T>(values: readonly T[]) => {
				const memoized = memoize(values);
				Array.from(memoized);
				return memoized;
			}
		}
	];
}

/**
 * A partial `memoize` of `values` read up to its first value only: its cache is not finished.
 */
export function unfinishedMemoize<T>(values: readonly T[]): Iterable<T> {
	const memoized = memoize(values);
	memoized[Symbol.iterator]().next();
	return memoized;
}

/**
 * A `memoize`, full or partial, whose cache holds `error`: its source yields 1 and 2, then throws `error`.
 */
export function failedMemoize(error: unknown, allowPartialMemoization: boolean): Iterable<number> {
	const memoized = memoize(throwingSource(3, error).iterable, { allowPartialMemoization });
	try {
		Array.from(memoized);
	} catch {
		// the error is now in the cache
	}
	return memoized;
}
