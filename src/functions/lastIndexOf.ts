import { Validations } from '../utils';

/**
 * Returns the index of the last value strictly equal (`===`) to `value`, like `Array.prototype.lastIndexOf`;
 * reads the whole source.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param value - the value to look for; `NaN` is never found, use `findLastIndex` for it
 * @returns the index of the last value equal to `value`, or `-1` if there is none
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`
 * @example
 * ```ts
 * Functions.lastIndexOf([1, 2, 3, 2], 2); // 3
 * ```
 * @since next
 */
export function lastIndexOf<T>(iterable: Iterable<T>, value: T): number {
	Validations.throwIfNotIterable(iterable, 'lastIndexOf');
	let result = -1;
	let index = 0;
	for (const v of iterable) {
		if (v === value)
			result = index;
		index++;
	}
	return result;
}
