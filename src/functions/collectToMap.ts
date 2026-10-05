import { Mapper } from '../types';
import { Validations } from '../utils';

/**
 * Collects the values of `iterable` into a `Map`, with the key returned by `keySelector`.
 * A later value with the same key (`SameValueZero`, as in `Map`) replaces the earlier one.
 * If `keySelector` throws, the source is closed and the error propagates.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param keySelector - called with each value and its index; returns the key of the value
 * @returns a `Map` from each key to the last value with that key; an empty `Map` when `iterable` is empty
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `keySelector` is not a function
 * @example
 * ```ts
 * Functions.collectToMap([{ id: 1, name: 'a' }, { id: 2, name: 'b' }], v => v.id); // Map { 1 => { id: 1, name: 'a' }, 2 => { id: 2, name: 'b' } }
 * ```
 * @since next
 */
export function collectToMap<T, K>(iterable: Iterable<T>, keySelector: Mapper<T, K>): Map<K, T>;
/**
 * Collects the values of `iterable` into a `Map`, with the key returned by `keySelector` and the value returned by `valueSelector`.
 * A later value with the same key (`SameValueZero`, as in `Map`) replaces the earlier one.
 * If `keySelector` or `valueSelector` throws, the source is closed and the error propagates.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param keySelector - called with each value and its index; returns the key of the value
 * @param valueSelector - called with each value and its index; returns the value to store; `undefined` stores the value itself
 * @returns a `Map` from each key to the value selected from the last value with that key; an empty `Map` when `iterable` is empty
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, if `keySelector` is not a function, or if a provided `valueSelector` is not a function
 * @example
 * ```ts
 * Functions.collectToMap([{ id: 1, name: 'a' }, { id: 2, name: 'b' }], v => v.id, v => v.name); // Map { 1 => 'a', 2 => 'b' }
 * ```
 * @since next
 */
export function collectToMap<T, K, V>(iterable: Iterable<T>, keySelector: Mapper<T, K>, valueSelector: Mapper<T, V> | undefined): Map<K, V>;
export function collectToMap<T, K, V>(iterable: Iterable<T>, keySelector: Mapper<T, K>, valueSelector?: Mapper<T, V>): Map<K, T | V> {
	Validations.throwIfNotIterable(iterable, 'collectToMap');
	Validations.throwIfNotFunction(keySelector, 'keySelector', 'collectToMap');
	const result = new Map<K, T | V>();
	let index = 0;
	// for…of closes the source if a selector throws
	if (valueSelector === undefined) {
		for (const value of iterable)
			result.set(keySelector(value, index++), value);
		return result;
	}
	Validations.throwIfNotFunction(valueSelector, 'valueSelector', 'collectToMap');
	for (const value of iterable) {
		result.set(keySelector(value, index), valueSelector(value, index));
		index++;
	}
	return result;
}
