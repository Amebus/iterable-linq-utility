import { Predicate } from "./_types";
import { isFunction } from "./_utils";

/**
 * 
 * @operation `Action`
 * @param iterable 
 * @param predicate 
 * @returns 
 */
export function some<T>(iterable: Iterable<T>, predicate: Predicate<T>): boolean {
  if (iterable == null)
    throw 'The source "iterable" must be provided';
	if(!isFunction(predicate))
		throw '"predicate" function must be provided';
  const iterator: Iterator<T> = iterable[Symbol.iterator]();
  let i = 0;

  for (let n = iterator.next(); n.done !== true; n = iterator.next()) {
    if (predicate(n.value, i++)) return true;
  }
  return false;
}