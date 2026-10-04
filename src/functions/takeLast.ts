import { Validations } from '../utils';
import { slice } from './slice';

/**
 * Lazily yields the last `count` values.
 * The whole source is read before the first value is yielded, keeping only the last `count` values, so `takeLast` does not end on an infinite source.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param count - how many values to yield; must be a non-negative integer
 * @returns a lazy, re-runnable `Iterable` of at most `count` values
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `count` is negative, not an integer, `NaN` or `Infinity`
 * @example
 * ```ts
 * Array.from(Functions.takeLast([1, 2, 3, 4, 5], 2)); // [4, 5]
 * ```
 * @since next
 */
export function takeLast<T>(iterable: Iterable<T>, count: number): Iterable<T> {
	Validations.throwIfNotIterable(iterable, 'takeLast');
	Validations.throwIfNotNonNegativeInteger(count, 'count', 'takeLast');
	// `slice(-0)` is `slice(0)`, every value: 0 is an empty slice, which closes the source without reading it
	return count === 0 ? slice(iterable, 0, 0) : slice(iterable, -count);
}
