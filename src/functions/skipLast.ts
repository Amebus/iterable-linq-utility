import { Validations } from '../utils';
import { slice } from './slice';

/**
 * Lazily yields every value except the last `count`.
 * A value is yielded once `count` more values have been read, keeping only those `count` values, so `skipLast` works with infinite sources.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param count - how many values to leave out at the end; must be a non-negative integer
 * @returns a lazy, re-runnable `Iterable` of the values before the last `count`
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `count` is negative, not an integer, `NaN` or `Infinity`
 * @example
 * ```ts
 * Array.from(Functions.skipLast([1, 2, 3, 4, 5], 2)); // [1, 2, 3]
 * ```
 * @since next
 */
export function skipLast<T>(iterable: Iterable<T>, count: number): Iterable<T> {
	Validations.throwIfNotIterable(iterable, 'skipLast');
	Validations.throwIfNotNonNegativeInteger(count, 'count', 'skipLast');
	// `slice(0, -0)` is `slice(0, 0)`, no value: 0 yields every value as it is read
	return count === 0 ? slice(iterable) : slice(iterable, 0, -count);
}
