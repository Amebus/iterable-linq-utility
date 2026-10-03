import { Predicate } from '../types';
import { Validations } from '../utils';

/**
 * Tells whether every value satisfies `predicate`; stops and closes the source at the first rejected value.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param predicate - called with each value and its index
 * @returns `true` if every value satisfies `predicate`, or if `iterable` is empty; `false` otherwise
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `predicate` is not a function
 * @example
 * ```ts
 * Functions.every([1, 2, 3], v => v > 0); // true
 * ```
 * @since 0.5.0
 */
export function every<T>(iterable: Iterable<T>, predicate: Predicate<T>): boolean {
	Validations.throwIfNotIterable(iterable, 'every');
	Validations.throwIfNotFunction(predicate, 'predicate', 'every');
	let index = 0;
	// for…of closes the source both when we return early and when the predicate throws
	for (const value of iterable) {
		if (!predicate(value, index++))
			return false;
	}
	return true;
}
