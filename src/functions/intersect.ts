import { DeferredIterable, OtherKeysIterator } from '../iterators';
import type { Mapper } from '../types';
import { isPropertyKey, Validations } from '../utils';

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
 * @throws Error if `iterable` or `other` is missing or does not implement `[Symbol.iterator]`, or if a provided `keySelector` is neither a function nor a property key
 * @example
 * ```ts
 * Array.from(Functions.intersect([1, 2, 2, 3], [2, 3, 4])); // [2, 3]
 * Array.from(Functions.intersect([{ id: 1 }, { id: 2 }], [{ id: 2 }], v => v.id)); // [{ id: 2 }]
 * ```
 * @since 0.12.0
 */
export function intersect<T, K>(iterable: Iterable<T>, other: Iterable<T>, keySelector?: Mapper<T, K>): Iterable<T>;
/**
 * Lazily yields the values of `iterable` whose property `key` is also the key of a value of `other`, once per key: the same as `intersect(iterable, other, v => v[key])`.
 * The keys are compared with `SameValueZero`, like `Set`.
 * A value that is `null` or `undefined` throws a `TypeError`: the source is closed and the error propagates.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param other - the `Iterable` to compare with
 * @param key - the property that gives the key: a `string`, a `symbol` or a `number`
 * @returns a lazy, re-runnable `Iterable` of the values of the source
 * @throws Error if `iterable` or `other` is missing or does not implement `[Symbol.iterator]`, or if `key` is neither a function nor a property key
 * @example
 * ```ts
 * Array.from(Functions.intersect([{ id: 1 }, { id: 2 }], [{ id: 2 }], 'id')); // [{ id: 2 }]
 * ```
 * @since next
 */
export function intersect<T>(iterable: Iterable<T>, other: Iterable<T>, key: keyof T): Iterable<T>;
export function intersect<T, K>(iterable: Iterable<T>, other: Iterable<T>, keySelector?: Mapper<T, K> | PropertyKey): Iterable<T> {
	Validations.throwIfNotIterable(iterable, 'intersect');
	Validations.throwIfNotIterable(other, 'intersect');
	if (keySelector === undefined)
		return new DeferredIterable(() => new IntersectIterator<T, K>(iterable, other));
	Validations.throwIfNotSelector(keySelector, 'keySelector', 'intersect');
	if (isPropertyKey(keySelector))
		return new DeferredIterable(() => new IntersectIterator<T, K>(iterable, other, undefined, keySelector));
	return new DeferredIterable(() => new IntersectIterator(iterable, other, keySelector));
}

class IntersectIterator<T, K> extends OtherKeysIterator<T, K> {
	protected keep(keys: Set<unknown>, key: unknown): boolean {
		// a key yielded once is removed, so the next values with the same key are skipped
		return keys.delete(key);
	}
}
