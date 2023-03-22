import { Action, AsyncAction, Unit, unit } from "../types";
import { isFunction, Validations } from "../utils";

/**
 * Performs the specified action on each element of the input `Iterable`
 * @param iterable input iterable
 * @param action the action to perform
 * @returns 
 */
export function forEach<T>(iterable: Iterable<T>, action: Action<T>): Unit {
	Validations.throwIfNotIterable(iterable);
	Validations.thowIfNotValidAction(action);

	const iterator = iterable[Symbol.iterator]();
	for(let n = iterator.next(), index = 0; n.done !== true; n = iterator.next(), index++) {
		action(n.value, index);
	}

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
	Validations.thowIfNotValidAction(action);
	
	const allPromises: Promise<Unit>[] = [];
	const iterator = iterable[Symbol.iterator]();
	for(let n = iterator.next(), index = 0; n.done !== true; n = iterator.next(), index++) {
		allPromises.push(action(n.value, index));
	}

	await Promise.all(allPromises);

	return unit();
}