import { Validations } from '../utils';

/**
 * Joins the values of `iterable` in a string, like `Array.prototype.join`; reads the whole source.
 * `null` and `undefined` become empty strings, every other value is converted with its `toString`.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param separator - the string between two values; defaults to `,`
 * @returns the joined values, `''` when `iterable` is empty
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`
 * @example
 * ```ts
 * Functions.join([1, 2, 3]); // '1,2,3'
 * Functions.join(['a', 'b'], ' - '); // 'a - b'
 * ```
 * @since next
 */
export function join<T>(iterable: Iterable<T>, separator?: string): string {
	Validations.throwIfNotIterable(iterable, 'join');
	return Array.from(iterable).join(separator);
}
