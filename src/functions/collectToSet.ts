import { Validations } from '../utils';

/**
 * Collects the values of `iterable` into a `Set`: a value equal to an earlier one (`SameValueZero`, as in `Set`) is left out.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @returns the distinct values, in the order of their first occurrence; an empty `Set` when `iterable` is empty
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`
 * @example
 * ```ts
 * Functions.collectToSet([1, 2, 1, 3]); // Set { 1, 2, 3 }
 * ```
 * @since 0.10.0
 */
export function collectToSet<T>(iterable: Iterable<T>): Set<T> {
	Validations.throwIfNotIterable(iterable, 'collectToSet');
	return new Set(iterable);
}
