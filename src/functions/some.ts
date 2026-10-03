import { Predicate } from '../types';
import { Validations } from '../utils';

/**
 * Tells whether `iterable` contains a value; reads one value, then closes the source.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @returns `true` if `iterable` contains a value; `false` when it is empty
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`
 * @example
 * ```ts
 * Functions.some([1, 2, 3]); // true
 * ```
 * @since 0.3.0
 */
export function some<T>(iterable: Iterable<T>): boolean;
/**
 * Tells whether at least one value satisfies `predicate`; stops and closes the source at the first match.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param predicate - called with each value and its index; `undefined` checks only whether a value exists
 * @returns `true` if a value satisfies `predicate`; `false` otherwise
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if a provided `predicate` is not a function
 * @example
 * ```ts
 * Functions.some([1, 2, 3], v => v > 2); // true
 * ```
 * @since 0.0.10
 */
export function some<T>(iterable: Iterable<T>, predicate: Predicate<T> | undefined): boolean;
export function some<T>(iterable: Iterable<T>, predicate?: Predicate<T>): boolean {
	Validations.throwIfNotIterable(iterable, 'some');
	if (predicate === undefined) {
		for (const _value of iterable)
			return true;
		return false;
	}
	Validations.throwIfNotFunction(predicate, 'predicate', 'some');
	let index = 0;
	// for…of closes the source both when we return early and when the predicate throws
	for (const value of iterable) {
		if (predicate(value, index++))
			return true;
	}
	return false;
}
