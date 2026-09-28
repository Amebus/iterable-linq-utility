import { unfold } from '../iterators';

/**
 * Returns an `Iterable` with no values.
 * @operation `Transformation`
 * @returns an empty, re-runnable `Iterable`
 * @example
 * ```ts
 * Array.from(Functions.empty<number>()); // []
 * ```
 * @since 0.0.10
 */
export function empty<T>(): Iterable<T> {
	return unfold<undefined, T>(undefined, () => undefined);
}
