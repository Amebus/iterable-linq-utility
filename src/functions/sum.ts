import { KeysOfType, Mapper } from '../types';
import { isPropertyKey, Validations } from '../utils';

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
 * @since 0.7.0
 */
export function sum(iterable: Iterable<number>): number;
/**
 * Sums the numbers returned by `selector` for each value; reads the whole source.
 * If `selector` throws, the source is closed and the error propagates.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param selector - called with each value and its index, returns the number to add; `undefined` sums the values themselves
 * @returns the sum of the selected numbers, `0` when `iterable` is empty
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if a provided `selector` is neither a function nor a property key
 * @example
 * ```ts
 * Functions.sum(['a', 'bb', 'ccc'], v => v.length); // 6
 * ```
 * @since 0.7.0
 */
export function sum<T>(iterable: Iterable<T>, selector: Mapper<T, number> | undefined): number;
/**
 * Sums the property `key` of each value: the same as `sum(iterable, v => v[key])`; reads the whole source.
 * A value that is `null` or `undefined` throws a `TypeError`: the source is closed and the error propagates.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param key - a property whose value is a `number`
 * @returns the sum of the values of the property, `0` when `iterable` is empty
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `key` is neither a function nor a property key
 * @example
 * ```ts
 * Functions.sum([{ price: 10 }, { price: 5 }], 'price'); // 15
 * ```
 * @since next
 */
export function sum<T>(iterable: Iterable<T>, key: KeysOfType<T, number>): number;
export function sum<T>(iterable: Iterable<T>, selector?: Mapper<T, number> | PropertyKey): number {
	Validations.throwIfNotIterable(iterable, 'sum');
	if (selector === undefined) {
		let result = 0;
		for (const value of iterable as Iterable<number>)
			result += value;
		return result;
	}
	Validations.throwIfNotSelector(selector, 'selector', 'sum');
	// each loop in its own function: a return before a loop, in the same function, slows the loop down by about 14% (#185)
	return isPropertyKey(selector) ? sumOfKey(iterable, selector) : sumOfSelector(iterable, selector);
}

function sumOfSelector<T>(iterable: Iterable<T>, selector: Mapper<T, number>): number {
	let result = 0;
	let index = 0;
	// for…of closes the source when the selector throws
	for (const value of iterable)
		result += selector(value, index++);
	return result;
}

function sumOfKey<T>(iterable: Iterable<T>, key: PropertyKey): number {
	let result = 0;
	// for…of closes the source when reading the property throws
	for (const value of iterable)
		result += (value as any)[key];
	return result;
}
