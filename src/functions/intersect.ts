import { DeferredIterable, OtherKeysIterator } from '../iterators';
import type { Mapper } from '../types';
import { Validations } from '../utils';

/**
 * Lazily yields the distinct values of `iterable` that are also in `other`, in the order of `iterable`.
 * Before the first value it reads the whole `other` into a `Set`, so `other` must be finite; each run reads it again.
 * Values, or the keys returned by `keySelector`, are compared with `SameValueZero`, like `Set`: for each key the first value of `iterable` is yielded.
 * If `keySelector` throws, or `other` throws, the sources are closed and the error propagates.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param other - the `Iterable` whose values, or keys, are kept
 * @param keySelector - called with every value of `iterable` and of `other`, and its index in its own source; omitted or `undefined` compares the values
 * @returns a lazy, re-runnable `Iterable` of the distinct values of `iterable` that are in `other`
 * @throws Error if `iterable` or `other` is missing or does not implement `[Symbol.iterator]`, or if a provided `keySelector` is not a function
 * @example
 * ```ts
 * Array.from(Functions.intersect([1, 2, 2, 3], [2, 3, 4])); // [2, 3]
 * Array.from(Functions.intersect([{ id: 1 }, { id: 2 }], [{ id: 2 }], v => v.id)); // [{ id: 2 }]
 * ```
 * @since next
 */
export function intersect<T, K>(iterable: Iterable<T>, other: Iterable<T>, keySelector?: Mapper<T, K>): Iterable<T> {
	Validations.throwIfNotIterable(iterable, 'intersect');
	Validations.throwIfNotIterable(other, 'intersect');
	if (keySelector !== undefined)
		Validations.throwIfNotFunction(keySelector, 'keySelector', 'intersect');
	return new DeferredIterable(() => new IntersectIterator(iterable, other, keySelector));
}

class IntersectIterator<T, K> extends OtherKeysIterator<T, K> {
	protected keep(keys: Set<unknown>, key: unknown): boolean {
		// a key yielded once is removed, so the next values with the same key are skipped
		return keys.delete(key);
	}
}
