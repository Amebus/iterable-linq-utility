import { unfold } from '../iterators';
import { Validations } from '../utils';

/**
 * Returns an `Iterable` that yields `value` `count` times.
 * @operation `Transformation`
 * @param value - the value to repeat
 * @param count - how many times; must be a non-negative integer
 * @returns a lazy, re-runnable `Iterable`
 * @throws Error if `count` is negative, not an integer, `NaN` or `Infinity`
 * @example
 * ```ts
 * Array.from(Functions.repeat('a', 3)); // ['a', 'a', 'a']
 * ```
 * @since 0.0.10
 */
export function repeat<T>(value: T, count: number): Iterable<T> {
	Validations.throwIfNotNonNegativeInteger(count, 'count');
	return unfold(count, left => left > 0 ? [value, left - 1] as const : undefined);
}
