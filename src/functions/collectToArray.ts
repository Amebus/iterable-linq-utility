import { Validations } from '../utils';

/**
 * Collects the values of `iterable` into an `Array`.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @returns the values, in order
 */
export function collectToArray<T>(iterable: Iterable<T>): T[] {
	Validations.throwIfNotIterable(iterable);
	return Array.from(iterable);
}
