import { LinqIterableWrapper, type ILinqIterable } from "./linqIterable";

import { 
  range
} from "@/functions";


export function from<T>(iterable: Iterable<T>): ILinqIterable<T> {
  return new LinqIterableWrapper(iterable);
}

export function fromRange(end: number): ILinqIterable<number>;
export function fromRange(end: number, reverse?: boolean): ILinqIterable<number>;
export function fromRange(start: number, end: number): ILinqIterable<number>;
export function fromRange(start: number, end: number, step: number): ILinqIterable<number>;
export function fromRange(start: number, end: number, reverse: boolean): ILinqIterable<number>;
export function fromRange(start: number, end: number, step: number, reverse: boolean): ILinqIterable<number>;
export function fromRange(start: number, end?: number | boolean, step?: number | boolean, reverse?: boolean): ILinqIterable<number> {
  return from(range(start, end, step, reverse));
}

export { ILinqIterable, LinqIterableWrapper };