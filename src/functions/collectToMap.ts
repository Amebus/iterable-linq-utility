import { ICollectToMapOptions, Mapper } from '../types';
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
 * @since 0.13.0
 */
export function collectToMap<T, P extends keyof T>(iterable: Iterable<T>, key: P): Map<T[P], T>;
/**
 * Collects the values of `iterable` into a `Map`, with the key returned by `keySelector`; `options.merge` decides the value
 * of a repeated key (`SameValueZero`, as in `Map`), which otherwise keeps the later value.
 * If `keySelector` or `merge` throws, the source is closed and the error propagates.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param keySelector - called with each value and its index; returns the key of the value
 * @param options - `merge`, called when a key is repeated with the value stored, the new value and the key; returns the value to store
 * @returns a `Map` from each key to its value; an empty `Map` when `iterable` is empty
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, if `keySelector` is neither a function nor a property key, or if a provided `merge` is not a function
 * @example
 * ```ts
 * Functions.collectToMap(['apple', 'avocado', 'banana'], w => w[0], { merge: first => first }); // Map { 'a' => 'apple', 'b' => 'banana' }
 * ```
 * @since next
 */
export function collectToMap<T, K>(iterable: Iterable<T>, keySelector: Mapper<T, K>, options: ICollectToMapOptions<K, T>): Map<K, T>;
/**
 * Collects the values of `iterable` into a `Map`, with their property `key` as the key; `options.merge` decides the value of
 * a repeated key (`SameValueZero`, as in `Map`), which otherwise keeps the later value.
 * A value that is `null` or `undefined` throws a `TypeError` where a property is read, and an error of `merge` propagates:
 * the source is closed.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param key - the property that gives the key: a `string`, a `symbol` or a `number`
 * @param options - `merge`, called when a key is repeated with the value stored, the new value and the key; returns the value to store
 * @returns a `Map` from each key to its value; an empty `Map` when `iterable` is empty
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, if `key` is not a property key, or if a provided `merge` is not a function
 * @example
 * ```ts
 * Functions.collectToMap([{ id: 1, name: 'a' }, { id: 1, name: 'b' }], 'id', { merge: first => first }); // Map { 1 => { id: 1, name: 'a' } }
 * ```
 * @since next
 */
export function collectToMap<T, P extends keyof T>(iterable: Iterable<T>, key: P, options: ICollectToMapOptions<T[P], T>): Map<T[P], T>;
/**
 * Collects the values of `iterable` into a `Map`, with the key returned by `keySelector` and the value returned by `valueSelector`.
 * A later value with the same key (`SameValueZero`, as in `Map`) replaces the earlier one, unless `options.merge` combines them.
 * If `keySelector` or `valueSelector` throws, the source is closed and the error propagates.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param keySelector - called with each value and its index; returns the key of the value
 * @param valueSelector - called with each value and its index; returns the value to store; `undefined` stores the value itself
 * @param options - `merge`, called when a key is repeated with the value stored, the value selected from the new element and the key; returns the value to store. If it throws, the source is closed and the error propagates
 * @returns a `Map` from each key to the value selected from the last value with that key; an empty `Map` when `iterable` is empty
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, if `keySelector` is neither a function nor a property key, if a provided `valueSelector` is neither a function nor a property key, if a provided `options` is not an object, or if a provided `merge` is not a function
 * @example
 * ```ts
 * Functions.collectToMap([{ id: 1, name: 'a' }, { id: 2, name: 'b' }], v => v.id, v => v.name); // Map { 1 => 'a', 2 => 'b' }
 * Functions.collectToMap(['apple', 'avocado', 'banana'], w => w[0], () => 1, { merge: (a, b) => a + b }); // Map { 'a' => 2, 'b' => 1 }
 * ```
 * @since 0.10.0
 */
export function collectToMap<T, K, V = T>(iterable: Iterable<T>, keySelector: Mapper<T, K>, valueSelector: Mapper<T, V> | undefined, options?: ICollectToMapOptions<K, V>): Map<K, V>;
/**
 * Collects the values of `iterable` into a `Map`, with the key returned by `keySelector` and their property `valueKey` as the value.
 * A later value with the same key (`SameValueZero`, as in `Map`) replaces the earlier one, unless `options.merge` combines them.
 * A value that is `null` or `undefined` throws a `TypeError` where a property is read: the source is closed and the error propagates.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param keySelector - called with each value and its index; returns the key of the value
 * @param valueKey - the property to store: a `string`, a `symbol` or a `number`
 * @param options - `merge`, called when a key is repeated with the value stored, the value selected from the new element and the key; returns the value to store. If it throws, the source is closed and the error propagates
 * @returns a `Map` from each key to the value selected from the last value with that key; an empty `Map` when `iterable` is empty
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, if a selector is neither a function nor a property key, if a provided `options` is not an object, or if a provided `merge` is not a function
 * @example
 * ```ts
 * Functions.collectToMap([{ id: 1, name: 'a' }, { id: 2, name: 'b' }], v => v.id, 'name'); // Map { 1 => 'a', 2 => 'b' }
 * ```
 * @since 0.13.0
 */
export function collectToMap<T, K, Q extends keyof T>(iterable: Iterable<T>, keySelector: Mapper<T, K>, valueKey: Q, options?: ICollectToMapOptions<K, T[Q]>): Map<K, T[Q]>;
/**
 * Collects the values of `iterable` into a `Map`, with their property `key` as the key and the value returned by `valueSelector`.
 * A later value with the same key (`SameValueZero`, as in `Map`) replaces the earlier one, unless `options.merge` combines them.
 * A value that is `null` or `undefined` throws a `TypeError` where a property is read: the source is closed and the error propagates.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param key - the property that gives the key: a `string`, a `symbol` or a `number`
 * @param valueSelector - called with each value and its index; returns the value to store; `undefined` stores the value itself
 * @param options - `merge`, called when a key is repeated with the value stored, the value selected from the new element and the key; returns the value to store. If it throws, the source is closed and the error propagates
 * @returns a `Map` from each key to the value selected from the last value with that key; an empty `Map` when `iterable` is empty
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, if a selector is neither a function nor a property key, if a provided `options` is not an object, or if a provided `merge` is not a function
 * @example
 * ```ts
 * Functions.collectToMap([{ id: 1, name: 'a' }, { id: 2, name: 'b' }], 'id', v => v.name.toUpperCase()); // Map { 1 => 'A', 2 => 'B' }
 * ```
 * @since 0.13.0
 */
export function collectToMap<T, P extends keyof T, V = T>(iterable: Iterable<T>, key: P, valueSelector: Mapper<T, V> | undefined, options?: ICollectToMapOptions<T[P], V>): Map<T[P], V>;
/**
 * Collects the values of `iterable` into a `Map`, with their property `key` as the key and their property `valueKey` as the value.
 * A later value with the same key (`SameValueZero`, as in `Map`) replaces the earlier one, unless `options.merge` combines them.
 * A value that is `null` or `undefined` throws a `TypeError` where a property is read: the source is closed and the error propagates.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param key - the property that gives the key: a `string`, a `symbol` or a `number`
 * @param valueKey - the property to store: a `string`, a `symbol` or a `number`
 * @param options - `merge`, called when a key is repeated with the value stored, the value selected from the new element and the key; returns the value to store. If it throws, the source is closed and the error propagates
 * @returns a `Map` from each key to the value selected from the last value with that key; an empty `Map` when `iterable` is empty
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, if a selector is neither a function nor a property key, if a provided `options` is not an object, or if a provided `merge` is not a function
 * @example
 * ```ts
 * Functions.collectToMap([{ id: 1, name: 'a' }, { id: 2, name: 'b' }], 'id', 'name'); // Map { 1 => 'a', 2 => 'b' }
 * ```
 * @since 0.13.0
 */
export function collectToMap<T, P extends keyof T, Q extends keyof T>(iterable: Iterable<T>, key: P, valueKey: Q, options?: ICollectToMapOptions<T[P], T[Q]>): Map<T[P], T[Q]>;
export function collectToMap<T, K, V>(iterable: Iterable<T>, keySelector: Mapper<T, K> | PropertyKey, valueSelectorOrOptions?: Mapper<T, V> | PropertyKey | ICollectToMapOptions<K, T | V>, options?: ICollectToMapOptions<K, T | V>): Map<K, T | V> {
	Validations.throwIfNotIterable(iterable, 'iterable', 'collectToMap');
	Validations.throwIfNotSelector(keySelector, 'keySelector', 'collectToMap');
	// an object in place of the value selector is the options: a selector is a function or a property key, never an object
	let valueSelector: Mapper<T, V> | PropertyKey | undefined;
	if (options === undefined && isOptionsArgument<K, T | V>(valueSelectorOrOptions))
		options = valueSelectorOrOptions;
	else if (valueSelectorOrOptions !== undefined) {
		Validations.throwIfNotSelector(valueSelectorOrOptions, 'valueSelector', 'collectToMap');
		valueSelector = valueSelectorOrOptions as Mapper<T, V> | PropertyKey;
	}
	if (options !== undefined) {
		Validations.throwIfNotObject(options, 'options', 'collectToMap');
		if (options.merge !== undefined) {
			Validations.throwIfNotFunction(options.merge, 'merge', 'collectToMap');
			return collectMerging(iterable, keySelector, valueSelector, options.merge);
		}
	}
	// each loop in its own function, so the loops of the functions keep their code (ADR 0025)
	if (valueSelector === undefined)
		return isPropertyKey(keySelector) ? collectByKey(iterable, keySelector) : collectByKeySelector(iterable, keySelector);
	if (isPropertyKey(keySelector))
		return isPropertyKey(valueSelector) ? collectByKeys(iterable, keySelector, valueSelector) : collectByMixed(iterable, keySelector, valueSelector);
	return isPropertyKey(valueSelector) ? collectByMixed(iterable, keySelector, valueSelector) : collectBySelectors(iterable, keySelector, valueSelector);
}

/**
 * Whether the argument after the key selector is the options: an object that is not an array, since a list of keys is not a
 * selector (ADR 0026) and must be reported as one.
 */
function isOptionsArgument<K, V>(value: unknown): value is ICollectToMapOptions<K, V> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
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

/**
 * A repeated key stores what `merge` returns: one loop for every kind of selector, so the loops without `merge` keep their
 * code. The kinds of the selectors are read once, and `get` comes first: `has` only for a key stored with `undefined`.
 */
function collectMerging<T, K, V>(iterable: Iterable<T>, keySelector: Mapper<T, K> | PropertyKey, valueSelector: Mapper<T, V> | PropertyKey | undefined, merge: (existing: T | V, incoming: T | V, key: K) => T | V): Map<K, T | V> {
	const result = new Map<K, T | V>();
	const keyFunction = isPropertyKey(keySelector) ? undefined : keySelector;
	const valueFunction = valueSelector === undefined || isPropertyKey(valueSelector) ? undefined : valueSelector;
	let index = 0;
	for (const value of iterable) {
		const key: K = keyFunction === undefined ? (value as any)[keySelector as PropertyKey] : keyFunction(value, index);
		const selected = valueFunction !== undefined ? valueFunction(value, index) : valueSelector === undefined ? value : (value as any)[valueSelector as PropertyKey];
		const existing = result.get(key);
		result.set(key, existing !== undefined || result.has(key) ? merge(existing as T | V, selected, key) : selected);
		index++;
	}
	return result;
}
