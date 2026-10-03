import type {
	Action,
	AsyncAction,
	Comparer,
	IIterableLinq,
	IIterableLinqBase,
	IMemoizeOptions,
	Mapper,
	Predicate,
	Reducer,
	Tapper,
	Unit
} from './types';

import {
	collectToArray,
	count,
	distinct,
	every,
	filter,
	find,
	findIndex,
	flatMap,
	forEach,
	forEachAsync,
	includes,
	indexOf,
	map,
	materialize,
	max,
	memoize,
	min,
	reduce,
	skip,
	skipWhile,
	some,
	take,
	takeWhile,
	tap,
	tapChain
} from './functions';

import { iterableLinqBrand } from './iterableLinqBrand';
import { Validations } from './utils';

/**
 * Wraps `iterable` in a chain. The only way the library creates chains.
 */
export function toChain<T>(iterable: Iterable<T>): IIterableLinq<T> {
	// the methods added with extend() live on the prototype at runtime and reach the type through module augmentation
	return new IterableLinqWrapper(iterable) as unknown as IIterableLinq<T>;
}

export class IterableLinqWrapper<T> implements IIterableLinqBase<T> {

	private readonly iterable: Iterable<T>;

	constructor(iterable: Iterable<T>) {
		this.iterable = iterable;
	}

	[Symbol.iterator](): Iterator<T, any, undefined> {
		return this.iterable[Symbol.iterator]();
	}

	collectToArray(): T[] {
		return collectToArray(this.iterable);
	}

	count(predicate?: Predicate<T>): number {
		return count(this.iterable, predicate);
	}

	distinct<K>(keySelector?: Mapper<T, K>): IIterableLinq<T> {
		return toChain(distinct(this.iterable, keySelector));
	}

	every(predicate: Predicate<T>): boolean {
		return every(this.iterable, predicate);
	}

	filter<S extends T>(predicate: (value: T, index: number) => value is S): IIterableLinq<S>;
	filter(predicate: Predicate<T>): IIterableLinq<T>;
	filter(predicate: Predicate<T>): IIterableLinq<T> {
		return toChain(filter(this.iterable, predicate));
	}

	find<S extends T>(predicate: (value: T, index: number) => value is S): S | undefined;
	find(predicate: Predicate<T>): T | undefined;
	find(predicate: Predicate<T>): T | undefined {
		return find(this.iterable, predicate);
	}

	findIndex(predicate: Predicate<T>): number {
		return findIndex(this.iterable, predicate);
	}

	flatMap<R>(mapper: Mapper<T, Iterable<R>>): IIterableLinq<R> {
		return toChain(flatMap(this.iterable, mapper));
	}

	forEach(action: Action<T>): Unit {
		return forEach(this.iterable, action);
	}

	forEachAsync(action: AsyncAction<T>): Promise<Unit> {
		return forEachAsync(this.iterable, action);
	}

	includes(value: T): boolean {
		return includes(this.iterable, value);
	}

	indexOf(value: T): number {
		return indexOf(this.iterable, value);
	}

	map<R>(mapper: Mapper<T, R>): IIterableLinq<R> {
		return toChain(map(this.iterable, mapper));
	}

	materialize(): IIterableLinq<T> {
		return toChain(materialize(this.iterable));
	}

	max(comparer?: Comparer<T>): T | undefined {
		return max(this.iterable, comparer);
	}

	memoize(options?: IMemoizeOptions): IIterableLinq<T> {
		return toChain(memoize(this.iterable, options));
	}

	min(comparer?: Comparer<T>): T | undefined {
		return min(this.iterable, comparer);
	}

	reduce(reducer: Reducer<T, T>): T;
	reduce<R>(neutralElement: R, reducer: Reducer<T, R>): R;
	reduce<R>(...args: [Reducer<T, T>] | [R, Reducer<T, R>]): T | R {
		// spreading args would not resolve the overloads: the number of arguments picks the form
		return args.length === 1
			? reduce(this.iterable, args[0])
			: reduce(this.iterable, args[0], args[1]);
	}

	skip(count: number): IIterableLinq<T> {
		return toChain(skip(this.iterable, count));
	}

	skipWhile(predicate: Predicate<T>): IIterableLinq<T> {
		return toChain(skipWhile(this.iterable, predicate));
	}

	some(predicate?: Predicate<T>): boolean {
		return some(this.iterable, predicate);
	}

	take(count: number): IIterableLinq<T> {
		return toChain(take(this.iterable, count));
	}

	takeWhile<S extends T>(predicate: (value: T, index: number) => value is S): IIterableLinq<S>;
	takeWhile(predicate: Predicate<T>): IIterableLinq<T>;
	takeWhile(predicate: Predicate<T>): IIterableLinq<T> {
		return toChain(takeWhile(this.iterable, predicate));
	}

	tap(tapper: Tapper<T>): IIterableLinq<T> {
		return toChain(tap(this.iterable, tapper));
	}

	tapChain(tapper: Tapper<Iterable<T>>): IIterableLinq<T> {
		return toChain(tapChain(this.iterable, tapper));
	}

	tapChainCreation(chainCreationTapper: (chain: IIterableLinq<T>) => Unit): IIterableLinq<T> {
		Validations.throwIfNotFunction(chainCreationTapper, 'chainCreationTapper');
		const chain = this as unknown as IIterableLinq<T>;
		chainCreationTapper(chain);
		return chain;
	}
}

Object.defineProperty(IterableLinqWrapper.prototype, iterableLinqBrand, {
	value: true,
	enumerable: false,
	writable: false,
	configurable: false
});
