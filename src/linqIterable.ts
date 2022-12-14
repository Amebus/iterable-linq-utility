import {
	Action,
	AsyncAction,

  Comparer,

  Mapper,
	
	Reducer,

  Predicate,
	
	Tapper,

	Unit
} from './types';

import { 
  filter,
	flatMap,
	forEach, forEachAsync
} from "./functions";

import {
  map,
  materialize,
  max,
  memoize, IMemoizeOptions,
  min
} from './functions';

import {
	reduce
} from './functions';

import {
  some
} from "./functions";

import {
  tap,
	tapChain
} from "./functions";

import { isFunction } from './utils';

export interface IIterableLinq<T> {

  [Symbol.iterator](): Iterator<T, any, undefined>;

  collectToArray(): T[];

  filter(predicate: Predicate<T>): IIterableLinq<T>; 
	flatMap<R>(mapper: Mapper<T, Iterable<R>>): IIterableLinq<R>;
	forEach(action: Action<T>): Unit;
	forEachAsync(action: AsyncAction<T>): Promise<Unit>;

  map<R>(mapper: Mapper<T, R>): IIterableLinq<R>;
  materialize(): IIterableLinq<T>;
  max(comparer?: Comparer<T>): T | null | undefined;
  memoize(options?: IMemoizeOptions): IIterableLinq<T>;
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
	tapChainCreation(chainCreationTapper: (iterableLinqWrapper: IIterableLinq<T>) => Unit): IIterableLinq<T>;
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
	flatMap<R>(mapper: Mapper<T, Iterable<R>>): IIterableLinq<R> {
		return new IterableLinqWrapper(flatMap(this.iterable, mapper));
	}
	forEach(action: Action<T>): Unit {
		return forEach(this.iterable, action);
	}
	forEachAsync(action: AsyncAction<T>): Promise<Unit> {
		return forEachAsync(this.iterable, action);
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
	memoize(options?: IMemoizeOptions): IIterableLinq<T> {
		return new IterableLinqWrapper(memoize(this.iterable, options));
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
		if(!isFunction(chainCreationTapper))
			throw '"tapper" function must be provided';
		chainCreationTapper(this);
		return this;
	}
}
