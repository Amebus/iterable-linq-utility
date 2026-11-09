import { Predicate } from '../types';
import { isPlainArray, Validations } from '../utils';

/**
 * Returns the index of the last value that satisfies `predicate`; reads the whole source.
 * On an array read by its built-in iterator, `predicate` is called from the last value backward, up to the first match,
 * like `Array.prototype.findLastIndex`.
 * If `predicate` throws, the source is closed and the error propagates.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param predicate - called with each value and its index
 * @returns the index of the last value that satisfies `predicate`, or `-1` if there is none
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `predicate` is not a function
 * @example
 * ```ts
 * Functions.findLastIndex([1, 5, 6, 2], v => v > 4); // 2
 * ```
 * @since 0.6.0
 */
export function findLastIndex<T>(iterable: Iterable<T>, predicate: Predicate<T>): number {
	Validations.throwIfNotIterable(iterable, 'iterable', 'findLastIndex');
	Validations.throwIfNotFunction(predicate, 'predicate', 'findLastIndex');
	if (isPlainArray(iterable))
		return findLastIndexInArray(iterable, predicate);
	let result = -1;
	let index = 0;
	// for…of closes the source when the predicate throws
	for (const value of iterable) {
		if (predicate(value, index))
			result = index;
		index++;
	}
	return result;
}

/**
 * Reads the array from the end and stops at the first match, like `Array.prototype.findLastIndex`: the length is read once, before
 * the first call of `predicate` (ADR 0036).
 */
function findLastIndexInArray<T>(array: readonly T[], predicate: Predicate<T>): number {
	for (let i = array.length - 1; i >= 0; i--) {
		if (predicate(array[i], i))
			return i;
	}
	return -1;
}
