import { LinqIterableWrapper, type ILinqIterable } from "./linqIterable";

import { 
  range
} from "@/functions";


export function from<T>(iterable: Iterable<T>): ILinqIterable<T> {
  return new LinqIterableWrapper(iterable);
}
export { ILinqIterable, LinqIterableWrapper };