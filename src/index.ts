import { LinqIterable } from "./linqIterable";

import {
  Comparer,
  Mapper,
  Predicate
} from '@/types';

import { 
  filter
} from "@/functions";

import {
  map,
  materialize,
  max,
  memoize,
  min
} from '@/functions';

import { 
  range
} from "@/functions";

import {
  some
} from "@/functions";

export interface ILinqIterable<T> {

  [Symbol.iterator](): Iterator<T, any, undefined>;

  collectToArray(): T[];

  filter( predicate: Predicate<T>): ILinqIterable<T>; 

  map<R>(mapper: Mapper<T, R>): ILinqIterable<R>;
  materialize(): ILinqIterable<T>;
  // max<T>(comparer?: Comparer<T>): T | null | undefined;
  memoize(): ILinqIterable<T>;
  // min<T>(comparer?: (a: T, b: T, index: number) => boolean): T | null | undefined;

  some(predicate: (value: T, index: number) => boolean): boolean;
}

declare module "./linqIterable" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface LinqIterable<T> extends ILinqIterable<T> {
    
  }
}

export function from<T>(iterable: Iterable<T>): ILinqIterable<T> {
	return new LinqIterable(iterable);
}

LinqIterable.prototype.filter = function<T>(predicate: (value: T, index: number) => boolean): ILinqIterable<T> {
  return from(filter(this.source, predicate));
};


LinqIterable.prototype.map = function<T,R>(mapper: (value: T, index: number) => R): ILinqIterable<R> {
  return from(map(this.source, mapper));
};
LinqIterable.prototype.materialize = function<T>(): ILinqIterable<T> {
  return from(materialize(this.source));
};
// LinqIterable.prototype.max = function<T>(comparer?: (a: T, b: T, index: number) => boolean): T | null | undefined {
//   return max(this.source(), comparer);
// };
LinqIterable.prototype.memoize = function<T>(): ILinqIterable<T> {
  return from(memoize(this.source));
};
// LinqIterable.prototype.min = function<T>(comparer?: (a: T, b: T, index: number) => boolean): T | null | undefined {
//   return min(this.source(), comparer);
// };

LinqIterable.prototype.some = function<T>(predicate: (value: T, index: number) => boolean): boolean {
  return some(this.source, predicate);
};