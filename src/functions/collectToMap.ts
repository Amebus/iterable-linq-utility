import { Mapper } from '../types';
import { isPropertyKey, Validations } from '../utils';

/**
 * Collects the values of `iterable` into a `Map`, with the key returned by `keySelector`.
 * A later value with the same key (`SameValueZero`, as in `Map`) replaces the earlier one.
 * If `keySelector` throws, the source is closed and the error propagates.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param keySelector - called with each value and its index; returns the key of the value
 * @returns a `Map` from each key to the last value with that key; an empty `Map` when `iterable` is empty
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `keySelector` is neither a function nor a property key
 * @example
 * ```ts
 * Functions.collectToMap([{ id: 1, name: 'a' }, { id: 2, name: 'b' }], v => v.id); // Map { 1 => { id: 1, name: 'a' }, 2 => { id: 2, name: 'b' } }
 * ```
 * @since 0.10.0
 */
export function collectToMap<T, K>(iterable: Iterable<T>, keySelector: Mapper<T, K>): Map<K, T>;
/**
 * Collects the values of `iterable` into a `Map`, with their property `key` as the key: the same as `collectToMap(iterable, v => v[key])`.
 * A later value with the same key (`SameValueZero`, as in `Map`) replaces the earlier one.
 * A value that is `null` or `undefined` throws a `TypeError` where a property is read: the source is closed and the error propagates.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param key - the property that gives the key: a `string`, a `symbol` or a `number`
 * @returns a `Map` from each key to the last value with that key; an empty `Map` when `iterable` is empty
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if a selector is neither a function nor a property key
 * @example
 * ```ts
 * Functions.collectToMap([{ id: 1, name: 'a' }, { id: 2, name: 'b' }], 'id'); // Map { 1 => { id: 1, name: 'a' }, 2 => { id: 2, name: 'b' } }
 * ```
 * @since next
 */
export function collectToMap<T, P extends keyof T>(iterable: Iterable<T>, key: P): Map<T[P], T>;
/**
 * Collects the values of `iterable` into a `Map`, with the key returned by `keySelector` and the value returned by `valueSelector`.
 * A later value with the same key (`SameValueZero`, as in `Map`) replaces the earlier one.
 * If `keySelector` or `valueSelector` throws, the source is closed and the error propagates.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param keySelector - called with each value and its index; returns the key of the value
 * @param valueSelector - called with each value and its index; returns the value to store; `undefined` stores the value itself
 * @returns a `Map` from each key to the value selected from the last value with that key; an empty `Map` when `iterable` is empty
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, if `keySelector` is neither a function nor a property key, or if a provided `valueSelector` is neither a function nor a property key
 * @example
 * ```ts
 * Functions.collectToMap([{ id: 1, name: 'a' }, { id: 2, name: 'b' }], v => v.id, v => v.name); // Map { 1 => 'a', 2 => 'b' }
 * ```
 * @since 0.10.0
 */
export function collectToMap<T, K, V = T>(iterable: Iterable<T>, keySelector: Mapper<T, K>, valueSelector: Mapper<T, V> | undefined): Map<K, V>;
/**
 * Collects the values of `iterable` into a `Map`, with the key returned by `keySelector` and their property `valueKey` as the value.
 * A later value with the same key (`SameValueZero`, as in `Map`) replaces the earlier one.
 * A value that is `null` or `undefined` throws a `TypeError` where a property is read: the source is closed and the error propagates.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param keySelector - called with each value and its index; returns the key of the value
 * @param valueKey - the property to store: a `string`, a `symbol` or a `number`
 * @returns a `Map` from each key to the value selected from the last value with that key; an empty `Map` when `iterable` is empty
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if a selector is neither a function nor a property key
 * @example
 * ```ts
 * Functions.collectToMap([{ id: 1, name: 'a' }, { id: 2, name: 'b' }], v => v.id, 'name'); // Map { 1 => 'a', 2 => 'b' }
 * ```
 * @since next
 */
export function collectToMap<T, K, Q extends keyof T>(iterable: Iterable<T>, keySelector: Mapper<T, K>, valueKey: Q): Map<K, T[Q]>;
/**
 * Collects the values of `iterable` into a `Map`, with their property `key` as the key and the value returned by `valueSelector`.
 * A later value with the same key (`SameValueZero`, as in `Map`) replaces the earlier one.
 * A value that is `null` or `undefined` throws a `TypeError` where a property is read: the source is closed and the error propagates.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param key - the property that gives the key: a `string`, a `symbol` or a `number`
 * @param valueSelector - called with each value and its index; returns the value to store; `undefined` stores the value itself
 * @returns a `Map` from each key to the value selected from the last value with that key; an empty `Map` when `iterable` is empty
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if a selector is neither a function nor a property key
 * @example
 * ```ts
 * Functions.collectToMap([{ id: 1, name: 'a' }, { id: 2, name: 'b' }], 'id', v => v.name.toUpperCase()); // Map { 1 => 'A', 2 => 'B' }
 * ```
 * @since next
 */
export function collectToMap<T, P extends keyof T, V = T>(iterable: Iterable<T>, key: P, valueSelector: Mapper<T, V> | undefined): Map<T[P], V>;
/**
 * Collects the values of `iterable` into a `Map`, with their property `key` as the key and their property `valueKey` as the value.
 * A later value with the same key (`SameValueZero`, as in `Map`) replaces the earlier one.
 * A value that is `null` or `undefined` throws a `TypeError` where a property is read: the source is closed and the error propagates.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param key - the property that gives the key: a `string`, a `symbol` or a `number`
 * @param valueKey - the property to store: a `string`, a `symbol` or a `number`
 * @returns a `Map` from each key to the value selected from the last value with that key; an empty `Map` when `iterable` is empty
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if a selector is neither a function nor a property key
 * @example
 * ```ts
 * Functions.collectToMap([{ id: 1, name: 'a' }, { id: 2, name: 'b' }], 'id', 'name'); // Map { 1 => 'a', 2 => 'b' }
 * ```
 * @since next
 */
export function collectToMap<T, P extends keyof T, Q extends keyof T>(iterable: Iterable<T>, key: P, valueKey: Q): Map<T[P], T[Q]>;
export function collectToMap<T, K, V>(iterable: Iterable<T>, keySelector: Mapper<T, K> | PropertyKey, valueSelector?: Mapper<T, V> | PropertyKey): Map<K, T | V> {
	Validations.throwIfNotIterable(iterable, 'collectToMap');
	Validations.throwIfNotSelector(keySelector, 'keySelector', 'collectToMap');
	// each loop in its own function, so the loops of the functions keep their code (ADR 0025)
	if (valueSelector === undefined)
		return isPropertyKey(keySelector) ? collectByKey(iterable, keySelector) : collectByKeySelector(iterable, keySelector);
	Validations.throwIfNotSelector(valueSelector, 'valueSelector', 'collectToMap');
	if (isPropertyKey(keySelector))
		return isPropertyKey(valueSelector) ? collectByKeys(iterable, keySelector, valueSelector) : collectByMixed(iterable, keySelector, valueSelector);
	return isPropertyKey(valueSelector) ? collectByMixed(iterable, keySelector, valueSelector) : collectBySelectors(iterable, keySelector, valueSelector);
}

// for…of closes the source if a selector throws, or if reading a property throws

function collectByKeySelector<T, K>(iterable: Iterable<T>, keySelector: Mapper<T, K>): Map<K, T> {
	const result = new Map<K, T>();
	let index = 0;
	for (const value of iterable)
		result.set(keySelector(value, index++), value);
	return result;
}

function collectByKey<T, K>(iterable: Iterable<T>, key: PropertyKey): Map<K, T> {
	const result = new Map<K, T>();
	for (const value of iterable)
		result.set((value as any)[key], value);
	return result;
}

function collectBySelectors<T, K, V>(iterable: Iterable<T>, keySelector: Mapper<T, K>, valueSelector: Mapper<T, V>): Map<K, V> {
	const result = new Map<K, V>();
	let index = 0;
	for (const value of iterable) {
		result.set(keySelector(value, index), valueSelector(value, index));
		index++;
	}
	return result;
}

function collectByKeys<T, K, V>(iterable: Iterable<T>, key: PropertyKey, valueKey: PropertyKey): Map<K, V> {
	const result = new Map<K, V>();
	for (const value of iterable)
		result.set((value as any)[key], (value as any)[valueKey]);
	return result;
}

/**
 * One selector is a function, the other a property key: a rare form, with one loop for both cases.
 */
function collectByMixed<T, K, V>(iterable: Iterable<T>, keySelector: Mapper<T, K> | PropertyKey, valueSelector: Mapper<T, V> | PropertyKey): Map<K, V> {
	const result = new Map<K, V>();
	let index = 0;
	for (const value of iterable) {
		const key = isPropertyKey(keySelector) ? (value as any)[keySelector] : keySelector(value, index);
		result.set(key, isPropertyKey(valueSelector) ? (value as any)[valueSelector] : valueSelector(value, index));
		index++;
	}
	return result;
}
