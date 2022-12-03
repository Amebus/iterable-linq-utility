import { LinqIterable } from "./linqIterable";

import { filter } from "./filter";

import { map } from "./map";
import { materialize } from "./materialize";
import { max } from "./max";
import { memoize } from "./memoize";
import { min } from "./min";

// import { range } from "./range";

import { some } from "./some";

export interface ILinqIterable<T> {

  [Symbol.iterator](): Iterator<T, any, undefined>;

  collectToArray(): T[];

  filter( predicate: (value: T, index: number) => boolean): ILinqIterable<T>; 

  map<R>(mapper: (value: T, index: number) => R): ILinqIterable<R>;
  materialize(): ILinqIterable<T>;
  max<T>(comparer?: (a: T, b: T, index: number) => boolean): T | null | undefined;
  memoize(): ILinqIterable<T>;
  // min<T>(comparer?: (a: T, b: T, index: number) => boolean): T | null | undefined;

  some(predicate: (value: T, index: number) => boolean): boolean;
}

declare module "./linqIterable" {
  interface LinqIterable<T> {
    filter( predicate: (value: T, index: number) => boolean): ILinqIterable<T>;

    map<R>(mapper: (value: T, index: number) => R): ILinqIterable<R>;
    materialize(): ILinqIterable<T>;
    max<T>(comparer?: (a: T, b: T, index: number) => boolean): T | null | undefined;
    memoize(): ILinqIterable<T>;
    // min<T>(comparer?: (a: T, b: T, index: number) => boolean): T | null | undefined;

    some(predicate: (value: T, index: number) => boolean): boolean;
  }
}

export function from<T>(iterable: Iterable<T>): ILinqIterable<T> {
	return new LinqIterable(iterable);
}

LinqIterable.prototype.filter = function<T>(predicate: (value: T, index: number) => boolean): ILinqIterable<T> {
  return from(filter(this.source(), predicate));
};


LinqIterable.prototype.map = function<T,R>(mapper: (value: T, index: number) => R): ILinqIterable<R> {
  return from(map(this.source(), mapper));
};
LinqIterable.prototype.materialize = function<T>(): ILinqIterable<T> {
  return from(materialize(this.source()));
};
LinqIterable.prototype.max = function<T>(comparer?: (a: T, b: T, index: number) => boolean): T | null | undefined {
  return max(this.source(), comparer);
};
LinqIterable.prototype.memoize = function<T>(): ILinqIterable<T> {
  return from(memoize(this.source()));
};
// LinqIterable.prototype.min = function<T>(comparer?: (a: T, b: T, index: number) => boolean): T | null | undefined {
//   return min(this.source(), comparer);
// };

LinqIterable.prototype.some = function<T>(predicate: (value: T, index: number) => boolean): boolean {
  return some(this.source(), predicate);
};