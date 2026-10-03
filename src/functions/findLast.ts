import { Predicate } from '../types';
import { Validations } from '../utils';

/**
 * Returns the last value accepted by a type guard, narrowing its type; reads the whole source.
 * If `predicate` throws, the source is closed and the error propagates.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param predicate - a type guard called with each value and its index
 * @returns the last value accepted by `predicate`, or `undefined` if there is none
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `predicate` is not a function
 * @example
 * ```ts
 * const values: (number | string)[] = [1, 'two', 3, 'four'];
 * Functions.findLast(values, (v): v is string => typeof v === 'string'); // string | undefined, 'four'
 * ```
 * @since 0.6.0
 */
export function findLast<T, S extends T>(iterable: Iterable<T>, predicate: (value: T, index: number) => value is S): S | undefined;

/**
 * Returns the last value that satisfies `predicate`; reads the whole source.
 * If `predicate` throws, the source is closed and the error propagates.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param predicate - called with each value and its index
 * @returns the last value that satisfies `predicate`, or `undefined` if there is none
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `predicate` is not a function
 * @example
 * ```ts
 * Functions.findLast([1, 5, 6, 2], v => v > 4); // 6
 * ```
 * @since 0.6.0
 */
export function findLast<T>(iterable: Iterable<T>, predicate: Predicate<T>): T | undefined;
export function findLast<T>(iterable: Iterable<T>, predicate: Predicate<T>): T | undefined {
	Validations.throwIfNotIterable(iterable, 'findLast');
	Validations.throwIfNotFunction(predicate, 'predicate', 'findLast');
	let result: T | undefined;
	let index = 0;
	// for…of closes the source when the predicate throws
	for (const value of iterable) {
		if (predicate(value, index++))
			result = value;
	}
	return result;
}
