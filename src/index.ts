import { IterableLinqWrapper, type IIterableLinq } from "./linqIterable";

import { 
  range
} from "@/functions";

import * as Functions from '@/functions';


export function from<T>(iterable: Iterable<T>): IIterableLinq<T> {
  return new IterableLinqWrapper(iterable);
}

export function fromRange(end: number): IIterableLinq<number>;
export function fromRange(end: number, reverse?: boolean): IIterableLinq<number>;
export function fromRange(start: number, end: number): IIterableLinq<number>;
export function fromRange(start: number, end: number, step: number): IIterableLinq<number>;
export function fromRange(start: number, end: number, reverse: boolean): IIterableLinq<number>;
export function fromRange(start: number, end: number, step: number, reverse: boolean): IIterableLinq<number>;
export function fromRange(start: number, end?: number | boolean, step?: number | boolean, reverse?: boolean): Iterable<number>;
export function fromRange(start: number, end?: number | boolean, step?: number | boolean, reverse?: boolean): IIterableLinq<number> {
  return from(range(start, end, step, reverse));
}

export {
  Functions,
  IIterableLinq, IterableLinqWrapper
};