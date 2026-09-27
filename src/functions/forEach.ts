import { Action, AsyncAction, Unit, unit } from '../types';
import { Validations } from '../utils';

/**
 * Performs the specified action on each element of the input `Iterable`
 * @param iterable input iterable
 * @param action the action to perform
 * @returns
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
 * Performs the specified async action on each element of the input `Iterable`
 * @param iterable input iterable
 * @param action the async action to perform
 * @returns
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
