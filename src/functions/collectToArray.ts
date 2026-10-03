import { Validations } from '../utils';

/**
 * Collects the values of `iterable` into an `Array`.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @returns the values, in order; an empty array when `iterable` is empty
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`
 * @example
 * ```ts
 * Functions.collectToArray(new Set([1, 2, 3])); // [1, 2, 3]
 * ```
 * @since 0.0.10
 */
export function collectToArray<T>(iterable: Iterable<T>): T[] {
	Validations.throwIfNotIterable(iterable, 'collectToArray');
	// Array.from is fast only for built-in collections: on other iterators a for…of loop is about twice as fast
	if (Array.isArray(iterable) || iterable instanceof Set)
		return Array.from(iterable);
	const result: T[] = [];
	for (const value of iterable)
		result.push(value);
	return result;
}
