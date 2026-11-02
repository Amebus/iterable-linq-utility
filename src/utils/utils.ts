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
