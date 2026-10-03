import { Predicate } from '../types';
import { Validations } from '../utils';

/**
 * Returns the index of the last value that satisfies `predicate`; reads the whole source.
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
 * @since next
 */
export function findLastIndex<T>(iterable: Iterable<T>, predicate: Predicate<T>): number {
	Validations.throwIfNotIterable(iterable, 'findLastIndex');
	Validations.throwIfNotFunction(predicate, 'predicate', 'findLastIndex');
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
