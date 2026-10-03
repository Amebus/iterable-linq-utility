import { Predicate } from '../types';
import { Validations } from '../utils';

/**
 * Counts the values of `iterable`; reads the whole source.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @returns the number of values in `iterable`
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`
 * @example
 * ```ts
 * Functions.count([1, 2, 3]); // 3
 * ```
 * @since 0.5.0
 */
export function count<T>(iterable: Iterable<T>): number;
/**
 * Counts the values that satisfy `predicate`; reads the whole source.
 * If `predicate` throws, the source is closed and the error propagates.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param predicate - called with each value and its index; `undefined` counts every value
 * @returns the number of values that satisfy `predicate`
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if a provided `predicate` is not a function
 * @example
 * ```ts
 * Functions.count([1, 5, 2, 6], v => v > 4); // 2
 * ```
 * @since 0.5.0
 */
export function count<T>(iterable: Iterable<T>, predicate: Predicate<T> | undefined): number;
export function count<T>(iterable: Iterable<T>, predicate?: Predicate<T>): number {
	Validations.throwIfNotIterable(iterable, 'count');
	let result = 0;
	if (predicate === undefined) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		for (const _value of iterable)
			result++;
		return result;
	}
	Validations.throwIfNotFunction(predicate, 'predicate', 'count');
	let index = 0;
	// for…of closes the source when the predicate throws
	for (const value of iterable) {
		if (predicate(value, index++))
			result++;
	}
	return result;
}
