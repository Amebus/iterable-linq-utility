import { IterableLinqWrapper, type IIterableLinq } from "./linqIterable";

import * as Functions from '@/functions';

import * as Types from '@/types';

export function empty<T>(): IIterableLinq<T> {
  return from(Functions.empty());
}

export function from<T>(iterable: Iterable<T>): IIterableLinq<T> {
  if (iterable == null)
    throw 'The source "iterable" must be provided';
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
  return from(Functions.range(start, end, step, reverse));
}

export function repeat<T>(value: T, count: number): IIterableLinq<T> {
  return from(Functions.repeat(value, count));
}

export {
  Functions,
  IIterableLinq, IterableLinqWrapper,
  Types
};