import { KeysOfType, Mapper } from '../types';
import { isPropertyKey, Validations } from '../utils';

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
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if a provided `selector` is neither a function nor a property key
 * @example
 * ```ts
 * Functions.average(['a', 'bb', 'ccc'], v => v.length); // 2
 * ```
 * @since 0.7.0
 */
export function average<T>(iterable: Iterable<T>, selector: Mapper<T, number> | undefined): number | undefined;
/**
 * Returns the average of the property `key` of each value: the same as `average(iterable, v => v[key])`; reads the whole source.
 * A value that is `null` or `undefined` throws a `TypeError`: the source is closed and the error propagates.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param key - a property whose value is a `number`
 * @returns the average of the values of the property, `undefined` when `iterable` is empty
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `key` is neither a function nor a property key
 * @example
 * ```ts
 * Functions.average([{ price: 10 }, { price: 5 }], 'price'); // 7.5
 * ```
 * @since next
 */
export function average<T>(iterable: Iterable<T>, key: KeysOfType<T, number>): number | undefined;
export function average<T>(iterable: Iterable<T>, selector?: Mapper<T, number> | PropertyKey): number | undefined {
	Validations.throwIfNotIterable(iterable, 'average');
	if (selector === undefined) {
		let total = 0;
		let count = 0;
		for (const value of iterable as Iterable<number>) {
			total += value;
			count++;
		}
		return count === 0 ? undefined : total / count;
	}
	Validations.throwIfNotSelector(selector, 'selector', 'average');
	// each loop in its own function, as in sum (ADR 0025)
	return isPropertyKey(selector) ? averageOfKey(iterable, selector) : averageOfSelector(iterable, selector);
}

function averageOfSelector<T>(iterable: Iterable<T>, selector: Mapper<T, number>): number | undefined {
	let total = 0;
	let count = 0;
	// for…of closes the source when the selector throws
	for (const value of iterable)
		total += selector(value, count++);
	return count === 0 ? undefined : total / count;
}

function averageOfKey<T>(iterable: Iterable<T>, key: PropertyKey): number | undefined {
	let total = 0;
	let count = 0;
	// for…of closes the source when reading the property throws
	for (const value of iterable) {
		total += (value as any)[key];
		count++;
	}
	return count === 0 ? undefined : total / count;
}
