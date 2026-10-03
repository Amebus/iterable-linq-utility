import { Validations } from '../utils';

/**
 * Tells whether `iterable` contains `value`, compared with `SameValueZero` like `Array.prototype.includes`;
 * stops and closes the source at the first match.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param value - the value to look for; `NaN` matches `NaN`, and `+0` matches `-0`
 * @returns `true` if `iterable` contains `value`; `false` otherwise
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`
 * @example
 * ```ts
 * Functions.includes([1, 2, NaN], NaN); // true
 * ```
 * @since next
 */
export function includes<T>(iterable: Iterable<T>, value: T): boolean {
	Validations.throwIfNotIterable(iterable);
	// SameValueZero: === except that NaN equals NaN
	const isNaNValue = value !== value;
	// for…of closes the source when we return early
	for (const v of iterable) {
		if (v === value || (isNaNValue && v !== v))
			return true;
	}
	return false;
}
