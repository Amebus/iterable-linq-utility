import { Predicate } from '../types';
import { Validations } from '../utils';

/**
 * Returns the index of the first value that satisfies `predicate`; stops and closes the source at the first match.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param predicate - called with each value and its index
 * @returns the index of the first value that satisfies `predicate`, or `-1` if there is none
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `predicate` is not a function
 * @example
 * ```ts
 * Functions.findIndex([1, 5, 6], v => v > 4); // 1
 * ```
 * @since next
 */
export function findIndex<T>(iterable: Iterable<T>, predicate: Predicate<T>): number {
	Validations.throwIfNotIterable(iterable);
	Validations.throwIfNotFunction(predicate, 'predicate');
	let index = 0;
	// for…of closes the source both when we return early and when the predicate throws
	for (const value of iterable) {
		if (predicate(value, index))
			return index;
		index++;
	}
	return -1;
}
