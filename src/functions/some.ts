import { Predicate } from "@/types";

/**
 * 
 * @operation `Action`
 * @param iterable 
 * @param predicate 
 * @returns 
 */
export function some<T>(iterable: Iterable<T>, predicate: Predicate<T>): boolean {
  const iterator: Iterator<T> = iterable[Symbol.iterator]();
  let i = 0;

  for (let n = iterator.next(); n.done !== true; n = iterator.next()) {
    if (predicate(n.value, i++)) return true;
  }
  return false;
}