import { arrayOf, isPlainSet, Validations } from '../utils';

/**
 * Tells whether `iterable` contains `value`, compared with `SameValueZero` like `Array.prototype.includes`;
 * stops and closes the source at the first match. An array or a `Set` read by its built-in iterator is searched with
 * `Array.prototype.includes` or `Set.prototype.has`, without iterating it.
 * The same holds for the iterable of `materialize`, and for the one of a `memoize` that is full or has been read to the end.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param value - the value to look for; `NaN` matches `NaN`, and `+0` matches `-0`
 * @returns `true` if `iterable` contains `value`; `false` otherwise
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`
 * @example
 * ```ts
 * Functions.includes([1, 2, NaN], NaN); // true
 * ```
 * @since 0.5.0
 */
export function includes<T>(iterable: Iterable<T>, value: T): boolean {
	Validations.throwIfNotIterable(iterable, 'iterable', 'includes');
	// the native methods scan the storage directly, with the same SameValueZero (ADR 0036)
	const array = arrayOf(iterable);
	if (array !== undefined)
		return Array.prototype.includes.call(array, value);
	if (isPlainSet(iterable))
		return Set.prototype.has.call(iterable, value);
	// SameValueZero: === except that NaN equals NaN
	const isNaNValue = value !== value;
	// for…of closes the source when we return early
	for (const v of iterable) {
		if (v === value || (isNaNValue && v !== v))
			return true;
	}
	return false;
}
