import { Validations } from '../utils';

/**
 * Tells whether `iterable` and `other` have the same values in the same order.
 * It reads the two sources side by side, and stops and closes both at the first difference or when one ends before the other.
 * If `equals` throws, both sources are closed and the error propagates; if a source throws, the other one is closed.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param other - the `Iterable` to compare with
 * @param equals - called with a value of `iterable` and the value of `other` at the same position; defaults to `SameValueZero`, like `Set` and `Map`: `NaN` equals `NaN`, `+0` equals `-0`, objects are compared by reference
 * @returns `true` if the two sources have the same number of values and every pair is equal
 * @throws Error if `iterable` or `other` is missing or does not implement `[Symbol.iterator]`, or if a provided `equals` is not a function
 * @example
 * ```ts
 * Functions.sequenceEqual([1, 2, 3], [1, 2, 3]); // true
 * Functions.sequenceEqual([1, 2], [1, 2, 3]); // false
 * Functions.sequenceEqual([NaN], [NaN]); // true
 * Functions.sequenceEqual([{ id: 1 }], [{ id: 1 }], (a, b) => a.id === b.id); // true
 * ```
 * @since 0.7.0
 */
export function sequenceEqual<T>(iterable: Iterable<T>, other: Iterable<T>, equals?: (a: T, b: T) => boolean): boolean {
	Validations.throwIfNotIterable(iterable, 'sequenceEqual');
	Validations.throwIfNotIterable(other, 'sequenceEqual');
	if (equals !== undefined)
		Validations.throwIfNotFunction(equals, 'equals', 'sequenceEqual');
	const otherIterator = other[Symbol.iterator]();
	// `other` is closed in the finally unless it has ended or has thrown;
	// for…of closes `iterable`
	let closeOther = true;
	try {
		for (const value of iterable) {
			closeOther = false;
			const otherResult = otherIterator.next();
			if (otherResult.done === true)
				return false;
			closeOther = true;
			const otherValue = otherResult.value;
			// SameValueZero (ADR 0024), inline: a default function called through a variable that also holds `equals` is not inlined, and the loop runs 2 to 4 times slower
			if (equals === undefined ? !(value === otherValue || (value !== value && otherValue !== otherValue)) : !equals(value, otherValue))
				return false;
		}
		closeOther = false;
		if (otherIterator.next().done === true)
			return true;
		closeOther = true;
		return false;
	} finally {
		if (closeOther)
			otherIterator.return?.();
	}
}
