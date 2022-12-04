import { isFunction } from "@/utils";

// TODO find a way to replace return type with IMaybe<T>
export function max<T>(iterable: Iterable<T>, comparer?: (a: T, b: T, index: number) => boolean): T | null | undefined {
  const iterator: Iterator<T> = iterable[Symbol.iterator]();
  let i = 0;
  let n = iterator.next();
	let max: T | null | undefined = n.value;
  const comp = isFunction(comparer) ? comparer : (a: T, b: T) => a > b;
  for (n = iterator.next(); n.done !== true; n = iterator.next()) {
    max = comp(max as T, n.value, i++) ? max : n.value;
  }
  return max == null ? null : max;
}