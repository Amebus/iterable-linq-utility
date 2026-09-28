import type { Comparer } from '../types';
import { findExtreme, toCompareFunction, Validations } from '../utils';

/**
 * Returns the smallest value; the first one among equals. `null`/`undefined` never win against a defined value.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param comparer - a compare function, a key, or a list of keys; defaults to `<`
 * @returns the smallest value, or `undefined` when `iterable` is empty
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`
 * @example
 * ```ts
 * Functions.min([3, 1, 2]); // 1
 * Functions.min([{ v: 1 }, { v: 3 }], 'v'); // { v: 1 }
 * ```
 * @since 0.0.10
 */
export function min<T>(iterable: Iterable<T>, comparer?: Comparer<T>): T | undefined {
	Validations.throwIfNotIterable(iterable);
	return findExtreme(iterable, toCompareFunction(comparer), -1);
}
