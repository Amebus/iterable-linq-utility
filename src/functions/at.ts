import { Validations } from '../utils';

/**
 * Returns the value at `index`, like `Array.prototype.at`; a negative index counts from the end.
 * A non-negative index reads up to the value, then closes the source; a negative index reads the whole source,
 * keeping only the last `-index` values.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param index - an integer; `-1` is the last value
 * @returns the value at `index`, or `undefined` if `iterable` has no value there
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `index` is not an integer (fractions, `NaN` and `Infinity` included)
 * @example
 * ```ts
 * Functions.at([10, 20, 30], 1); // 20
 * Functions.at([10, 20, 30], -1); // 30
 * ```
 * @since next
 */
export function at<T>(iterable: Iterable<T>, index: number): T | undefined {
	Validations.throwIfNotIterable(iterable);
	Validations.throwIfNotInteger(index, 'index');
	return index >= 0 ? atStart(iterable, index) : atEnd(iterable, -index);
}

function atStart<T>(iterable: Iterable<T>, index: number): T | undefined {
	let i = 0;
	// for…of closes the source when we return early
	for (const value of iterable) {
		if (i++ === index)
			return value;
	}
	return undefined;
}

/**
 * The `size`-th value from the end: a circular buffer keeps the last `size` values read.
 */
function atEnd<T>(iterable: Iterable<T>, size: number): T | undefined {
	const buffer: T[] = [];
	let position = 0;
	let full = false;
	// a branch instead of `count++ % size`: on an array source the modulo makes the loop about 1.3× slower
	for (const value of iterable) {
		buffer[position] = value;
		if (++position === size) {
			position = 0;
			full = true;
		}
	}
	// once full, the oldest value in the buffer is the next one to be overwritten
	return full ? buffer[position] : undefined;
}
