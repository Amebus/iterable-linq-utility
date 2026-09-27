import { unfold } from '../iterators';
import { Validations } from '../utils';

/**
 * Returns an `Iterable` that yields `value` `count` times.
 * @operation `Transformation`
 * @param value - the value to repeat
 * @param count - how many times; must be a non-negative integer
 * @returns a lazy, re-runnable `Iterable`
 */
export function repeat<T>(value: T, count: number): Iterable<T> {
	Validations.throwIfNotNonNegativeInteger(count, 'count');
	return unfold(count, left => left > 0 ? [value, left - 1] as const : undefined);
}
