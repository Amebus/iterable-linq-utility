import type { IRangeOptions } from '../types';

/**
 * Checks whether `value` is a function (including classes, async and generator functions).
 */
export function isFunction(value?: any): value is (...args: any[]) => any {
	return typeof value === 'function';
}

/**
 * Whether the second argument of `range` is the options: missing, or an object. Any other value is the end, so a bound of the
 * wrong type is reported as `end`, not as the options.
 */
export function isRangeOptionsArgument(value: unknown): value is IRangeOptions | undefined {
	return value === undefined || (typeof value === 'object' && value !== null);
}

/**
 * Whether an Action may read `iterable` as an array, by index (ADR 0036): an `Array` whose `[Symbol.iterator]` is the built-in
 * one, so that reading it by index gives the values the iteration would give.
 */
export function isPlainArray<T>(iterable: Iterable<T>): iterable is readonly T[] {
	return Array.isArray(iterable) && iterable[Symbol.iterator] === Array.prototype[Symbol.iterator];
}

/**
 * Whether an Action may read `iterable` as a `Set` (ADR 0036): a `Set` whose `[Symbol.iterator]` is the built-in one.
 */
export function isPlainSet<T>(iterable: Iterable<T>): iterable is ReadonlySet<T> {
	return iterable instanceof Set && iterable[Symbol.iterator] === Set.prototype[Symbol.iterator];
}
