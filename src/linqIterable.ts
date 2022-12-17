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



export interface IIterableLinq<T> {

  [Symbol.iterator](): Iterator<T, any, undefined>;

  collectToArray(): T[];

  filter(predicate: Predicate<T>): IIterableLinq<T>; 

  map<R>(mapper: Mapper<T, R>): IIterableLinq<R>;
  materialize(): IIterableLinq<T>;
  max(comparer?: Comparer<T>): T | null | undefined;
  memoize(): IIterableLinq<T>;
  min(comparer?: Comparer<T>): T | null | undefined;

  some(predicate: Predicate<T>): boolean;
}

export class IterableLinqWrapper<T> implements IIterableLinq<T> {

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

	filter(predicate: Predicate<T>): IIterableLinq<T> {
		return new IterableLinqWrapper(filter(this.iterable, predicate));
	}

	map<R>(mapper: Mapper<T, R>): IIterableLinq<R> {
		return new IterableLinqWrapper(map(this.iterable, mapper));
	}
	materialize(): IIterableLinq<T> {
		return new IterableLinqWrapper(materialize(this.iterable));
	}
	max(comparer?: Comparer<T>): T | null | undefined {
		return max(this.iterable, comparer);
	}
	memoize(): IIterableLinq<T> {
		return new IterableLinqWrapper(memoize(this.iterable));
	}
	min(comparer?: Comparer<T>): T | null | undefined {
		return min(this.iterable, comparer);
	}

	some(predicate: Predicate<T>): boolean {
		return some(this.iterable, predicate);
	}
}
