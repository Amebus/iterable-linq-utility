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
  some
} from "@/functions";



export interface ILinqIterable<T> {

  [Symbol.iterator](): Iterator<T, any, undefined>;

  collectToArray(): T[];

  filter(predicate: Predicate<T>): ILinqIterable<T>; 

  map<R>(mapper: Mapper<T, R>): ILinqIterable<R>;
  materialize(): ILinqIterable<T>;
  // max<T>(comparer?: Comparer<T>): T | null | undefined;
  memoize(): ILinqIterable<T>;
  // min<T>(comparer?: (a: T, b: T, index: number) => boolean): T | null | undefined;

  some(predicate:  Predicate<T>): boolean;
}

export class LinqIterable<T> implements ILinqIterable<T> {

	constructor(iterable: Iterable<T>) {
		this.iterable = iterable;
	}
	[Symbol.iterator](): Iterator<T, any, undefined> {
		return this.iterable[Symbol.iterator]();
	}

	private iterable: Iterable<T>;

	collectToArray(): T[] {
		return [...this.iterable];
	}

	filter(predicate: Predicate<T>): ILinqIterable<T> {
		return new LinqIterable(filter(this.iterable, predicate));
	}

	map<R>(mapper: Mapper<T, R>): ILinqIterable<R> {
		return new LinqIterable(map(this.iterable, mapper));
	}
	materialize(): ILinqIterable<T> {
		return new LinqIterable(materialize(this.iterable));
	}
	memoize(): ILinqIterable<T> {
		return new LinqIterable(memoize(this.iterable));
	}

	some(predicate: Predicate<T>): boolean {
		return some(this.iterable, predicate);
	}
}

// LinqIterable.prototype.max = function<T>(comparer?: (a: T, b: T, index: number) => boolean): T | null | undefined {
//   return max(this.source(), comparer);
// };

// LinqIterable.prototype.min = function<T>(comparer?: (a: T, b: T, index: number) => boolean): T | null | undefined {
//   return min(this.source(), comparer);
// };
