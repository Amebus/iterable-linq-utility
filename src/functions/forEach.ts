import { Action, AsyncAction, Unit, unit } from '../types';
import { Validations } from '../utils';

/**
 * Calls `action` on each value of `iterable`. If `action` throws, the source is closed and the error propagates.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param action - called with each value and its index; returns `unit()`
 * @returns `unit()`
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `action` is not a function
 * @example
 * ```ts
 * Functions.forEach([1, 2], v => {
 * 	console.log(v); // 1, 2
 * 	return unit();
 * });
 * ```
 * @since 0.0.11
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
 * @param action - called with each value and its index; returns a promise of `unit()`
 * @returns a promise resolved with `unit()` after the last action, or rejected with the first error
 * @throws Error, as a rejection of the returned promise, if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `action` is not a function
 * @example
 * ```ts
 * await Functions.forEachAsync(['a.txt', 'b.txt'], async file => {
 * 	await upload(file); // 'b.txt' starts after 'a.txt' has finished
 * 	return unit();
 * });
 * ```
 * @since 0.0.11
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
