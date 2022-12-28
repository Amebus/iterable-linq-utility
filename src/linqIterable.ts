import {
  Comparer,

  Mapper,
	
	Reducer,

  Predicate,
	
	Tapper
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
	reduce
} from '@/functions';

import {
  some
} from "@/functions";

import {
  tap,
	tapChain
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

	reduce<R>(neutralElement: R, reducer: Reducer<T, R>): R;

  some(predicate: Predicate<T>): boolean;

	tap(tapper: Tapper<T>): IIterableLinq<T>;
	tapChain(tapper: Tapper<Iterable<T>>): IIterableLinq<T>;
	/**
	 * 
	 * @operation `Tap`
	 * @param chainCreationTapper 
	 */
	tapChainCreation(chainCreationTapper: (iterableLinqWrapper: IIterableLinq<T>) => void): IIterableLinq<T>;
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
		return Array.from(this.iterable);
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

	reduce<R>(neutralElement: R, reducer: Reducer<T, R>): R {
		return reduce(this.iterable, neutralElement, reducer);
	}

	some(predicate: Predicate<T>): boolean {
		return some(this.iterable, predicate);
	}

	tap(tapper: Tapper<T>): IIterableLinq<T> {
		return new IterableLinqWrapper(tap(this.iterable, tapper));
	}
	tapChain(tapper: Tapper<Iterable<T>>): IIterableLinq<T> {
		return new IterableLinqWrapper(tapChain(this.iterable, tapper));
	}
	tapChainCreation(chainCreationTapper: (iterableLinqWrapper: IIterableLinq<T>) => void): IIterableLinq<T> {
		chainCreationTapper(this);
		return this;
	}
}
