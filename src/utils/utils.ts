/**
 * Checks whether `value` is a function (including classes, async and generator functions).
 */
export function isFunction(value?: any): value is (...args: any[]) => any {
	return typeof value === 'function';
}
