import type { Comparer } from '../types';
import { isFunction } from './utils';

export type CompareFunction<T> = (a: T, b: T) => number;

function compareValues(a: unknown, b: unknown): number {
	return (a as any) < (b as any) ? -1 : a === b ? 0 : 1;
}

/**
 * Turns a `Comparer` (a function, a key or a list of keys) into a compare function. Without a comparer, `min` and `max`
 * compare in their own loop (`findMinValue`, `findMaxValue`).
 */
export function toCompareFunction<T>(comparer: Comparer<T>): CompareFunction<T> {
	if (isFunction(comparer))
		return comparer;
	const keys = Array.isArray(comparer) ? comparer : [comparer];
	return (a, b) => {
		for (const key of keys) {
			const r = compareValues(a[key], b[key]);
			if (r !== 0)
				return r;
		}
		return 0;
	};
}

/**
 * Finds the greatest (`sign` 1) or the smallest (`sign` -1) element, keeping the first one among equals.
 * `null` and `undefined` elements never win against a defined one.
 * @returns `undefined` when the iterable is empty
 */
export function findExtreme<T>(iterable: Iterable<T>, compare: CompareFunction<T>, sign: 1 | -1): T | undefined {
	let best: T | undefined = undefined;
	let hasBest = false;
	for (const candidate of iterable) {
		if (!hasBest || (best == null && candidate != null)) {
			best = candidate;
			hasBest = true;
		} else if (candidate != null && sign * compare(best as T, candidate) < 0) {
			best = candidate;
		}
	}
	return best;
}

/**
 * `findExtreme` with the default comparison written in the loop, for `max` without a comparer: a compare function called
 * through a variable that also holds the comparers of the user is not inlined, and the loop is 2 to 4 times slower (#177).
 */
export function findMaxValue<T>(iterable: Iterable<T>): T | undefined {
	let best: T | undefined = undefined;
	let hasBest = false;
	for (const candidate of iterable) {
		if (!hasBest || (best == null && candidate != null)) {
			best = candidate;
			hasBest = true;
		} else if (candidate != null && (best as any) < (candidate as any)) {
			// compareValues(best, candidate) < 0
			best = candidate;
		}
	}
	return best;
}

/**
 * `findExtreme` with the default comparison written in the loop, for `min` without a comparer (see `findMaxValue`).
 */
export function findMinValue<T>(iterable: Iterable<T>): T | undefined {
	let best: T | undefined = undefined;
	let hasBest = false;
	for (const candidate of iterable) {
		if (!hasBest || (best == null && candidate != null)) {
			best = candidate;
			hasBest = true;
		} else if (candidate != null && !((best as any) < (candidate as any)) && best !== candidate) {
			// compareValues(best, candidate) > 0: not `candidate < best`, which differs for NaN, mixed types and equal dates
			best = candidate;
		}
	}
	return best;
}
