import { Validations } from '../utils';
import { map } from './map';

/**
 * Lazily yields `[index, value]` pairs, like `Array.prototype.entries`.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @returns a lazy, re-runnable `Iterable` of pairs of the index, from 0, and the value
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`
 * @example
 * ```ts
 * Array.from(Functions.entries(['a', 'b'])); // [[0, 'a'], [1, 'b']]
 * ```
 * @since 0.10.0
 */
export function entries<T>(iterable: Iterable<T>): Iterable<[number, T]> {
	Validations.throwIfNotIterable(iterable, 'entries');
	return map(iterable, toEntry);
}

function toEntry<T>(value: T, index: number): [number, T] {
	return [index, value];
}
