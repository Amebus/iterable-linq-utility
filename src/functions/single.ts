import { Predicate } from '../types';
import { libraryError, Validations } from '../utils';

/**
 * Returns the only value of `iterable`, `undefined` if it is empty; throws if it has more than one.
 * It stops and closes the source at the second value, so it also ends on an infinite source.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @returns the only value, or `undefined` when `iterable` is empty
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if it contains more than one value
 * @example
 * ```ts
 * Functions.single([5]); // 5
 * Functions.single([]); // undefined
 * Functions.single([1, 2]); // throws
 * ```
 * @since 0.7.0
 */
export function single<T>(iterable: Iterable<T>): T | undefined;

/**
 * Returns the only value accepted by a type guard, narrowing its type, `undefined` if there is none; throws if there is more than one.
 * It stops and closes the source at the second match. If `predicate` throws, the source is closed and the error propagates.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param predicate - a type guard called with each value and its index
 * @returns the only value accepted by `predicate`, or `undefined` if there is none
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, if `predicate` is not a function, or if more than one value satisfies it
 * @example
 * ```ts
 * const values: (number | string)[] = [1, 'two', 3];
 * Functions.single(values, (v): v is string => typeof v === 'string'); // string | undefined, 'two'
 * ```
 * @since 0.7.0
 */
export function single<T, S extends T>(iterable: Iterable<T>, predicate: (value: T, index: number) => value is S): S | undefined;

/**
 * Returns the only value that satisfies `predicate`, `undefined` if there is none; throws if there is more than one.
 * It stops and closes the source at the second match. If `predicate` throws, the source is closed and the error propagates.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param predicate - called with each value and its index; `undefined` looks for the only value of `iterable`
 * @returns the only value that satisfies `predicate`, or `undefined` if there is none
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, if a provided `predicate` is not a function, or if more than one value satisfies it
 * @example
 * ```ts
 * Functions.single([1, 5, 2], v => v > 4); // 5
 * Functions.single([5, 6], v => v > 4); // throws
 * ```
 * @since 0.7.0
 */
export function single<T>(iterable: Iterable<T>, predicate: Predicate<T> | undefined): T | undefined;
export function single<T>(iterable: Iterable<T>, predicate?: Predicate<T>): T | undefined {
	Validations.throwIfNotIterable(iterable, 'single');
	let found = false;
	let result: T | undefined;
	// for…of closes the source when we throw at the second match and when the predicate throws
	if (predicate === undefined) {
		for (const value of iterable) {
			if (found)
				throw libraryError('single', 'The iterable contains more than one value');
			found = true;
			result = value;
		}
		return result;
	}
	Validations.throwIfNotFunction(predicate, 'predicate', 'single');
	let index = 0;
	for (const value of iterable) {
		if (!predicate(value, index++))
			continue;
		if (found)
			throw libraryError('single', 'More than one value satisfies the predicate');
		found = true;
		result = value;
	}
	return result;
}
