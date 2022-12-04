import { LinqIterable, type ILinqIterable } from "./linqIterable";

import { 
  range
} from "@/functions";


export function from<T>(iterable: Iterable<T>): ILinqIterable<T> {
  return new LinqIterable(iterable);
}
export { ILinqIterable };