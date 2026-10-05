import type {
	Action,
	AsyncAction,
	Comparer,
	FlatIterable,
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
	append,
	at,
	average,
	chunk,
	collectToArray,
	collectToMap,
	collectToSet,
	concat,
	count,
	defaultIfEmpty,
	distinct,
	entries,
	every,
	filter,
	find,
	findIndex,
	findLast,
	findLastIndex,
	flat,
	flatMap,
	forEach,
	forEachAsync,
	includes,
	indexOf,
	join,
	lastIndexOf,
	map,
	materialize,
	max,
	memoize,
	min,
	prepend,
	reduce,
	reduceRight,
	reverse,
	sequenceEqual,
	single,
	skip,
	skipLast,
	skipWhile,
	slice,
	some,
	sum,
	take,
	takeLast,
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

	append(value: T): IIterableLinq<T> {
		return toChain(append(this.iterable, value));
	}

	at(index: number): T | undefined {
		return at(this.iterable, index);
	}

	average(selector?: Mapper<T, number>): number | undefined {
		return average(this.iterable, selector);
	}

	chunk(size: number): IIterableLinq<T[]> {
		return toChain(chunk(this.iterable, size));
	}

	collectToArray(): T[] {
		return collectToArray(this.iterable);
	}

	collectToMap<K>(keySelector: Mapper<T, K>): Map<K, T>;
	collectToMap<K, V>(keySelector: Mapper<T, K>, valueSelector: Mapper<T, V> | undefined): Map<K, V>;
	collectToMap<K, V>(keySelector: Mapper<T, K>, valueSelector?: Mapper<T, V>): Map<K, T | V> {
		return collectToMap(this.iterable, keySelector, valueSelector);
	}

	collectToSet(): Set<T> {
		return collectToSet(this.iterable);
	}

	concat(...others: Iterable<T>[]): IIterableLinq<T> {
		return toChain(concat(this.iterable, ...others));
	}

	count(predicate?: Predicate<T>): number {
		return count(this.iterable, predicate);
	}

	defaultIfEmpty(value: T): IIterableLinq<T> {
		return toChain(defaultIfEmpty(this.iterable, value));
	}

	distinct<K>(keySelector?: Mapper<T, K>): IIterableLinq<T> {
		return toChain(distinct(this.iterable, keySelector));
	}

	entries(): IIterableLinq<[number, T]> {
		return toChain(entries(this.iterable));
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

	findLast<S extends T>(predicate: (value: T, index: number) => value is S): S | undefined;
	findLast(predicate: Predicate<T>): T | undefined;
	findLast(predicate: Predicate<T>): T | undefined {
		return findLast(this.iterable, predicate);
	}

	findLastIndex(predicate: Predicate<T>): number {
		return findLastIndex(this.iterable, predicate);
	}

	flat<D extends number = 1>(depth?: D): IIterableLinq<FlatIterable<T, D>> {
		return toChain(flat(this.iterable, depth));
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

	join(separator?: string): string {
		return join(this.iterable, separator);
	}

	lastIndexOf(value: T): number {
		return lastIndexOf(this.iterable, value);
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

	prepend(value: T): IIterableLinq<T> {
		return toChain(prepend(this.iterable, value));
	}

	reduce(reducer: Reducer<T, T>): T;
	reduce<R>(neutralElement: R, reducer: Reducer<T, R>): R;
	reduce<R>(...args: [Reducer<T, T>] | [R, Reducer<T, R>]): T | R {
		// spreading args would not resolve the overloads: the number of arguments picks the form
		return args.length === 1
			? reduce(this.iterable, args[0])
			: reduce(this.iterable, args[0], args[1]);
	}

	reduceRight(reducer: Reducer<T, T>): T;
	reduceRight<R>(neutralElement: R, reducer: Reducer<T, R>): R;
	reduceRight<R>(...args: [Reducer<T, T>] | [R, Reducer<T, R>]): T | R {
		// spreading args would not resolve the overloads: the number of arguments picks the form
		return args.length === 1
			? reduceRight(this.iterable, args[0])
			: reduceRight(this.iterable, args[0], args[1]);
	}

	reverse(): IIterableLinq<T> {
		return toChain(reverse(this.iterable));
	}

	sequenceEqual(other: Iterable<T>, equals?: (a: T, b: T) => boolean): boolean {
		return sequenceEqual(this.iterable, other, equals);
	}

	single<S extends T>(predicate: (value: T, index: number) => value is S): S | undefined;
	single(predicate?: Predicate<T>): T | undefined;
	single(predicate?: Predicate<T>): T | undefined {
		return single(this.iterable, predicate);
	}

	skip(count: number): IIterableLinq<T> {
		return toChain(skip(this.iterable, count));
	}

	skipLast(count: number): IIterableLinq<T> {
		return toChain(skipLast(this.iterable, count));
	}

	skipWhile(predicate: Predicate<T>): IIterableLinq<T> {
		return toChain(skipWhile(this.iterable, predicate));
	}

	slice(start?: number, end?: number): IIterableLinq<T> {
		return toChain(slice(this.iterable, start, end));
	}

	some(predicate?: Predicate<T>): boolean {
		return some(this.iterable, predicate);
	}

	sum(selector?: Mapper<T, number>): number {
		return sum(this.iterable, selector);
	}

	take(count: number): IIterableLinq<T> {
		return toChain(take(this.iterable, count));
	}

	takeLast(count: number): IIterableLinq<T> {
		return toChain(takeLast(this.iterable, count));
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
		Validations.throwIfNotFunction(chainCreationTapper, 'chainCreationTapper', 'tapChainCreation');
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
