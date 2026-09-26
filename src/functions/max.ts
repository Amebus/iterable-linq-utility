import type { Comparer } from '../types';
import { findExtreme, toCompareFunction, Validations } from '../utils';

/**
 *
 * @operation `Action`
 * @param iterable
 * @param comparer
 * @returns
 */
export function max<T>(iterable: Iterable<T>, comparer?: Comparer<T>): T | undefined {
	Validations.throwIfNotIterable(iterable);
	return findExtreme(iterable, toCompareFunction(comparer), 1);
}
