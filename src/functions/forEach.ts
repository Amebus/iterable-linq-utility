import { Action, AsyncAction, Unit, unit } from '../types';
import { Validations } from '../utils';

/**
 * Calls `action` on each value of `iterable`. If `action` throws, the source is closed and the error propagates.
 * @operation `Action`
 * @param iterable the source `Iterable`
 * @param action called with each value and its index
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
 * Calls the async `action` on each value of `iterable`. Every action starts during the iteration, so they run in parallel.
 * @operation `Action`
 * @param iterable the source `Iterable`
 * @param action called with each value and its index; returns a promise
 * @returns a promise resolved with `unit()` when every action has resolved, or rejected with the first error
 */
export async function forEachAsync<T>(iterable: Iterable<T>, action: AsyncAction<T>): Promise<Unit> {
	Validations.throwIfNotIterable(iterable);
	Validations.throwIfNotFunction(action, 'action');

	const allPromises: Promise<Unit>[] = [];
	let index = 0;
	// every action starts during the iteration (parallel execution); for…of closes the source if one throws
	for (const value of iterable)
		allPromises.push(action(value, index++));

	await Promise.all(allPromises);

	return unit();
}
