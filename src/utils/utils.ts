import type { IRangeOptions } from '../types';

/**
 * Checks whether `value` is a function (including classes, async and generator functions).
 */
export function isFunction(value?: any): value is (...args: any[]) => any {
	return typeof value === 'function';
}

/**
 * Whether the second argument of `range` is the options: missing, or an object. Any other value is the end, so a bound of the
 * wrong type is reported as `end`, not as the options.
 */
export function isRangeOptionsArgument(value: unknown): value is IRangeOptions | undefined {
	return value === undefined || (typeof value === 'object' && value !== null);
}

/**
 * Whether an Action may read `iterable` as an array, by index (ADR 0036): an `Array` whose `[Symbol.iterator]` is the built-in
 * one, so that reading it by index gives the values the iteration would give.
 */
export function isPlainArray<T>(iterable: Iterable<T>): iterable is readonly T[] {
	return Array.isArray(iterable) && iterable[Symbol.iterator] === Array.prototype[Symbol.iterator];
}

/**
 * The key of the method by which the iterables of `memoize` and `materialize` give their stored values as an array (ADR 0038).
 * The package does not export it, so no other iterable has the method.
 */
export const storedValues: unique symbol = Symbol('storedValues');

/**
 * An iterable of the library that stores its values in an array: `[storedValues]()` gives the array, which nothing changes
 * afterwards, or `undefined` when the iterable must be iterated.
 */
export interface IStoredValues<T> {
	[storedValues](): readonly T[] | undefined;
}

/**
 * The array an Action may read by index instead of iterating `iterable` (ADR 0036, 0038): a plain array itself, the stored
 * values of a `materialize`, the cache of a full `memoize`, filled first, or of a partial `memoize` once it is finished.
 * @returns `undefined` for any other iterable, for a partial `memoize` not finished and for a `memoize` whose cache holds an
 * error
 */
export function arrayOf<T>(iterable: Iterable<T>): readonly T[] | undefined {
	if (isPlainArray(iterable))
		return iterable;
	return (iterable as Partial<IStoredValues<T>>)[storedValues]?.();
}

/**
 * Whether an Action may read `iterable` as a `Set` (ADR 0036): a `Set` whose `[Symbol.iterator]` is the built-in one.
 */
export function isPlainSet<T>(iterable: Iterable<T>): iterable is ReadonlySet<T> {
	return iterable instanceof Set && iterable[Symbol.iterator] === Set.prototype[Symbol.iterator];
}

/**
 * Whether an Action may read `iterable` as a `Map` (ADR 0037): a `Map` whose `[Symbol.iterator]` is the built-in one.
 */
export function isPlainMap<K, V>(iterable: Iterable<[K, V]> | Iterable<unknown>): iterable is ReadonlyMap<K, V> {
	return iterable instanceof Map && iterable[Symbol.iterator] === Map.prototype[Symbol.iterator];
}
