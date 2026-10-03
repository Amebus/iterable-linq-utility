import { Validations } from '../utils';

/**
 * Returns the index of the first value strictly equal (`===`) to `value`, like `Array.prototype.indexOf`;
 * stops and closes the source at the first match.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param value - the value to look for; `NaN` is never found, use `includes` or `findIndex` for it
 * @returns the index of the first value equal to `value`, or `-1` if there is none
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`
 * @example
 * ```ts
 * Functions.indexOf([1, 2, 3, 2], 2); // 1
 * ```
 * @since next
 */
export function indexOf<T>(iterable: Iterable<T>, value: T): number {
	Validations.throwIfNotIterable(iterable, 'indexOf');
	let index = 0;
	// for…of closes the source when we return early
	for (const v of iterable) {
		if (v === value)
			return index;
		index++;
	}
	return -1;
}
