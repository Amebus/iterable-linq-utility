import { arrayOf, Validations } from '../utils';

/**
 * Returns the index of the last value strictly equal (`===`) to `value`, like `Array.prototype.lastIndexOf`;
 * reads the whole source. An array read by its built-in iterator is read from the end, up to the first match.
 * The same holds for the iterable of `materialize`, and for the one of a `memoize` that is full or has been read to the end.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param value - the value to look for; `NaN` is never found, use `findLastIndex` for it
 * @returns the index of the last value equal to `value`, or `-1` if there is none
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`
 * @example
 * ```ts
 * Functions.lastIndexOf([1, 2, 3, 2], 2); // 3
 * ```
 * @since 0.6.0
 */
export function lastIndexOf<T>(iterable: Iterable<T>, value: T): number {
	Validations.throwIfNotIterable(iterable, 'iterable', 'lastIndexOf');
	const array = arrayOf(iterable);
	if (array !== undefined)
		return lastIndexOfInArray(array, value);
	let result = -1;
	let index = 0;
	for (const v of iterable) {
		if (v === value)
			result = index;
		index++;
	}
	return result;
}

/**
 * Reads the array from the end and stops at the first match (ADR 0036). A loop, not `Array.prototype.lastIndexOf`: the native
 * method skips the holes, which the iteration reads as `undefined`, and it is slower than the loop when the value is missing.
 */
function lastIndexOfInArray<T>(array: readonly T[], value: T): number {
	for (let i = array.length - 1; i >= 0; i--) {
		if (array[i] === value)
			return i;
	}
	return -1;
}
