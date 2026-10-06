import { DeferredIterable, OtherKeysIterator } from '../iterators';
import type { Mapper } from '../types';
import { Validations } from '../utils';

/**
 * Lazily yields the distinct values of `iterable` that are not in `other`, in the order of `iterable`.
 * Before the first value it reads the whole `other` into a `Set`, so `other` must be finite; each run reads it again.
 * Values, or the keys returned by `keySelector`, are compared with `SameValueZero`, like `Set`: for each key the first value of `iterable` is yielded.
 * If `keySelector` throws, or `other` throws, the sources are closed and the error propagates.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param other - the `Iterable` whose values, or keys, are left out
 * @param keySelector - called with every value of `iterable` and of `other`, and its index in its own source; omitted or `undefined` compares the values
 * @returns a lazy, re-runnable `Iterable` of the distinct values of `iterable` that are not in `other`
 * @throws Error if `iterable` or `other` is missing or does not implement `[Symbol.iterator]`, or if a provided `keySelector` is not a function
 * @example
 * ```ts
 * Array.from(Functions.except([1, 2, 2, 3], [3, 4])); // [1, 2]
 * Array.from(Functions.except([{ id: 1 }, { id: 2 }], [{ id: 2 }], v => v.id)); // [{ id: 1 }]
 * ```
 * @since 0.12.0
 */
export function except<T, K>(iterable: Iterable<T>, other: Iterable<T>, keySelector?: Mapper<T, K>): Iterable<T> {
	Validations.throwIfNotIterable(iterable, 'except');
	Validations.throwIfNotIterable(other, 'except');
	if (keySelector !== undefined)
		Validations.throwIfNotFunction(keySelector, 'keySelector', 'except');
	return new DeferredIterable(() => new ExceptIterator(iterable, other, keySelector));
}

class ExceptIterator<T, K> extends OtherKeysIterator<T, K> {
	protected keep(keys: Set<unknown>, key: unknown): boolean {
		if (keys.has(key))
			return false;
		// a key yielded once is added, so the next values with the same key are skipped
		keys.add(key);
		return true;
	}
}
