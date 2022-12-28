import { Reducer } from "@/types";
import { isFunction } from "@/utils";

/**
 * 
 * @operation `Action`
 * @param iterable 
 * @param neutralElement 
 * @param reducer 
 * @returns 
 */
export function reduce<T, R>(iterable: Iterable<T>, neutralElement: R, reducer: Reducer<T, R>) {
  if (iterable == null)
    throw 'The source "iterable" must be provided';
	if(!isFunction(reducer))
		throw '"reducer" function must be provided';

	const iterator: Iterator<T> = iterable[Symbol.iterator]();
	let result = neutralElement;
	let index = 0;
	for (let n = iterator.next(); n.done !== true; n = iterator.next()) {
		result = reducer(result, n.value, index);
    index++;
  }
	return result;
}
