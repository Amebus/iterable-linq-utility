import { Action, AsyncAction, Unit, unit } from '../types';
import { Validations } from '../utils';

/**
 * Calls `action` on each value of `iterable`. If `action` throws, the source is closed and the error propagates.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param action - called with each value and its index
 * @returns `unit()`
 */
export function forEach<T>(iterable: Iterable<T>, action: Action<T>): Unit {
	Validations.throwIfNotIterable(iterable);
	Validations.throwIfNotFunction(action, 'action');

	let index = 0;
	// for…of closes the source if the action throws
	for (const value of iterable)
		action(value, index++);

	return unit();
}

/**
 * Calls the async `action` on each value of `iterable`, sequentially: each action starts after the previous one has settled.
 * The first rejection stops the iteration and closes the source. Works on infinite sources.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param action - called with each value and its index; returns a promise
 * @returns a promise resolved with `unit()` after the last action, or rejected with the first error
 */
export async function forEachAsync<T>(iterable: Iterable<T>, action: AsyncAction<T>): Promise<Unit> {
	Validations.throwIfNotIterable(iterable);
	Validations.throwIfNotFunction(action, 'action');

	let index = 0;
	// sequential: each action starts after the previous one has settled; for…of closes the source on the first rejection
	for (const value of iterable)
		await action(value, index++);

	return unit();
}
