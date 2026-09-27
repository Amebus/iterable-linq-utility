import { unfold } from '../iterators';

/**
 * Returns an `Iterable` with no values.
 * @operation `Transformation`
 * @returns an empty, re-runnable `Iterable`
 */
export function empty<T>(): Iterable<T> {
	return unfold<undefined, T>(undefined, () => undefined);
}
