import type { Comparer } from "./types";
import { isFunction } from "./utils";

// TODO find a way to replace return type with IMaybe<T>
export function min<T>(iterable: Iterable<T>, comparer?: Comparer<T>): T | null | undefined {
  const iterator: Iterator<T> = iterable[Symbol.iterator]();
  let i = 0;
  let n = iterator.next();
  let min: T | null | undefined = n.value;

  let comp: Comparer<T> = null!;
  if (comparer == null) {
    comp = (a: T, b: T) => a < b ? -1 : a === b ? 0 : 1;
  } else if (isFunction(comparer)) {
    comp = comparer;
  } else if (Array.isArray(comparer)) {
    comp = (a: T, b: T) => {
      let r = 0;
      for(const key of comparer) {
        r = a[key] < b[key] ? -1 : a[key] === b[key] ? 0 : 1;
        if (r !== 0)
          break;
      }
      return r;
    };
  } else {
    comp = (a: T, b: T) => a[comparer] < b[comparer] ? -1 : a[comparer] === b[comparer] ? 0 : 1;
  }

  for (n = iterator.next(); n.done !== true; n = iterator.next()) {
    const c = comp(min as T, n.value, i++);
    min = c < 0 || c === 0 ? min : n.value;
  }
  return min == null ? null : min;
}