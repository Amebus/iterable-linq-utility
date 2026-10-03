import { Predicate } from '../types';
import { Validations } from '../utils';

/**
 * Returns the first value accepted by a type guard, narrowing its type; stops and closes the source at the first match.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param predicate - a type guard called with each value and its index
 * @returns the first value accepted by `predicate`, or `undefined` if there is none
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `predicate` is not a function
 * @example
 * ```ts
 * const values: (number | string)[] = [1, 'two', 3];
 * Functions.find(values, (v): v is string => typeof v === 'string'); // string | undefined, 'two'
 * ```
 * @since 0.5.0
 */
export function find<T, S extends T>(iterable: Iterable<T>, predicate: (value: T, index: number) => value is S): S | undefined;

/**
 * Returns the first value that satisfies `predicate`; stops and closes the source at the first match.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param predicate - called with each value and its index
 * @returns the first value that satisfies `predicate`, or `undefined` if there is none
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `predicate` is not a function
 * @example
 * ```ts
 * Functions.find([1, 5, 6], v => v > 4); // 5
 * ```
 * @since 0.5.0
 */
export function find<T>(iterable: Iterable<T>, predicate: Predicate<T>): T | undefined;
export function find<T>(iterable: Iterable<T>, predicate: Predicate<T>): T | undefined {
	Validations.throwIfNotIterable(iterable, 'find');
	Validations.throwIfNotFunction(predicate, 'predicate', 'find');
	let index = 0;
	// for…of closes the source both when we return early and when the predicate throws
	for (const value of iterable) {
		if (predicate(value, index++))
			return value;
	}
	return undefined;
}
