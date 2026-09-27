import type {
	Action,
	AsyncAction,
	Comparer,
	IIterableLinq,
	IMemoizeOptions,
	Mapper,
	Predicate,
	Reducer,
	Tapper,
	Unit
} from './types';

import {
	filter,
	flatMap,
	forEach,
	forEachAsync,
	map,
	materialize,
	max,
	memoize,
	min,
	reduce,
	some,
	tap,
	tapChain
} from './functions';

import { iterableLinqBrand } from './iterableLinqBrand';
import { Validations } from './utils';

export class IterableLinqWrapper<T> implements IIterableLinq<T> {

	private readonly iterable: Iterable<T>;

	constructor(iterable: Iterable<T>) {
		this.iterable = iterable;
	}

	[Symbol.iterator](): Iterator<T, any, undefined> {
		return this.iterable[Symbol.iterator]();
	}

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

	max(comparer?: Comparer<T>): T | undefined {
		return max(this.iterable, comparer);
	}

	memoize(options?: IMemoizeOptions): IIterableLinq<T> {
		return new IterableLinqWrapper(memoize(this.iterable, options));
	}

	min(comparer?: Comparer<T>): T | undefined {
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

	tapChainCreation(chainCreationTapper: (iterableLinqWrapper: IIterableLinq<T>) => Unit): IIterableLinq<T> {
		Validations.throwIfNotFunction(chainCreationTapper, 'chainCreationTapper');
		chainCreationTapper(this);
		return this;
	}
}

Object.defineProperty(IterableLinqWrapper.prototype, iterableLinqBrand, {
	value: true,
	enumerable: false,
	writable: false,
	configurable: false
});
