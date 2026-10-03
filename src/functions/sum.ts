import { Mapper } from '../types';
import { Validations } from '../utils';

/**
 * Sums the values of `iterable` with `+`; reads the whole source.
 * The values are not checked: `NaN` makes the result `NaN`.
 * @operation `Action`
 * @param iterable - the source `Iterable` of numbers
 * @returns the sum of the values, `0` when `iterable` is empty
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`
 * @example
 * ```ts
 * Functions.sum([1, 2, 3]); // 6
 * ```
 * @since next
 */
export function sum(iterable: Iterable<number>): number;
/**
 * Sums the numbers returned by `selector` for each value; reads the whole source.
 * If `selector` throws, the source is closed and the error propagates.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param selector - called with each value and its index, returns the number to add; `undefined` sums the values themselves
 * @returns the sum of the selected numbers, `0` when `iterable` is empty
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if a provided `selector` is not a function
 * @example
 * ```ts
 * Functions.sum(['a', 'bb', 'ccc'], v => v.length); // 6
 * ```
 * @since next
 */
export function sum<T>(iterable: Iterable<T>, selector: Mapper<T, number> | undefined): number;
export function sum<T>(iterable: Iterable<T>, selector?: Mapper<T, number>): number {
	Validations.throwIfNotIterable(iterable, 'sum');
	let result = 0;
	if (selector === undefined) {
		for (const value of iterable as Iterable<number>)
			result += value;
		return result;
	}
	Validations.throwIfNotFunction(selector, 'selector', 'sum');
	let index = 0;
	// for…of closes the source when the selector throws
	for (const value of iterable)
		result += selector(value, index++);
	return result;
}
