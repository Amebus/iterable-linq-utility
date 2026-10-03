import { Mapper } from '../types';
import { Validations } from '../utils';

/**
 * Returns the average of the values of `iterable`: their sum with `+` divided by their number; reads the whole source.
 * The values are not checked: `NaN` makes the result `NaN`.
 * @operation `Action`
 * @param iterable - the source `Iterable` of numbers
 * @returns the average of the values, `undefined` when `iterable` is empty
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`
 * @example
 * ```ts
 * Functions.average([1, 2, 3, 4]); // 2.5
 * ```
 * @since 0.7.0
 */
export function average(iterable: Iterable<number>): number | undefined;
/**
 * Returns the average of the numbers returned by `selector` for each value; reads the whole source.
 * If `selector` throws, the source is closed and the error propagates.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param selector - called with each value and its index, returns the number to average; `undefined` averages the values themselves
 * @returns the average of the selected numbers, `undefined` when `iterable` is empty
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if a provided `selector` is not a function
 * @example
 * ```ts
 * Functions.average(['a', 'bb', 'ccc'], v => v.length); // 2
 * ```
 * @since 0.7.0
 */
export function average<T>(iterable: Iterable<T>, selector: Mapper<T, number> | undefined): number | undefined;
export function average<T>(iterable: Iterable<T>, selector?: Mapper<T, number>): number | undefined {
	Validations.throwIfNotIterable(iterable, 'average');
	let total = 0;
	let count = 0;
	if (selector === undefined) {
		for (const value of iterable as Iterable<number>) {
			total += value;
			count++;
		}
	} else {
		Validations.throwIfNotFunction(selector, 'selector', 'average');
		// for…of closes the source when the selector throws
		for (const value of iterable)
			total += selector(value, count++);
	}
	return count === 0 ? undefined : total / count;
}
