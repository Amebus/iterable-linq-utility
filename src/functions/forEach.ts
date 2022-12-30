import { Action, AsyncAction, Unit, unit } from "./_types";
import { isFunction } from "./_utils";

export function forEach<T>(iterable: Iterable<T>, action: Action<T>): Unit {
	if (iterable == null)
		throw 'The source "iterable" must be provided';
	if(!isFunction(action))
		throw '"action" function must be provided';

	
	const iterator = iterable[Symbol.iterator]();
	for(let n = iterator.next(), index = 0; n.done !== true; n = iterator.next(), index++) {
		action(n.value, index);
	}

	return unit();
}

export async function forEachAsync<T>(iterable: Iterable<T>, action: AsyncAction<T>): Promise<Unit> {
	if (iterable == null)
		throw 'The source "iterable" must be provided';
	if(!isFunction(action))
		throw '"action" function must be provided';

	
	const allPromises: Promise<Unit>[] = [];
	const iterator = iterable[Symbol.iterator]();
	for(let n = iterator.next(), index = 0; n.done !== true; n = iterator.next(), index++) {
		allPromises.push(action(n.value, index));
	}

	await Promise.all(allPromises);

	return unit();
}