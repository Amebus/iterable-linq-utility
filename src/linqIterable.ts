import {
	Action,
	AsyncAction,
	Comparer,
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
	type IMemoizeOptions,
	min,
	reduce,
	some,
	tap,
	tapChain
} from './functions';

import { Validations } from './utils';

/**
 * Fluent wrapper over an `Iterable`: every call builds a lazy, re-runnable operations chain.
 * Transformations return a new `IIterableLinq`; actions run the chain and return a result.
 */
export interface IIterableLinq<T> {

	[Symbol.iterator](): Iterator<T, any, undefined>;

	/**
	 * Runs the chain and collects its values into an `Array`.
	 * @operation `Action`
	 * @returns the values of the chain, in order
	 * @example
	 * IterableLinq.from([1, 2, 3]).map(v => v * 10).collectToArray(); // [10, 20, 30]
	 */
	collectToArray(): T[];

	/**
	 * Keeps only the values that satisfy `predicate`.
	 * @operation `Transformation`
	 * @param predicate called with each value and its index; return `true` to keep the value
	 * @returns a new chain with the kept values
	 * @example
	 * IterableLinq.from([1, 2, 3, 4]).filter(v => v % 2 === 0).collectToArray(); // [2, 4]
	 */
	filter(predicate: Predicate<T>): IIterableLinq<T>;

	/**
	 * Maps each value to an `Iterable` and flattens the results into one chain.
	 * @operation `Transformation`
	 * @param mapper called with each value and its index; returns the `Iterable` to flatten
	 * @returns a new chain with the flattened values
	 * @example
	 * IterableLinq.from([1, 2]).flatMap(v => [v, v * 10]).collectToArray(); // [1, 10, 2, 20]
	 */
	flatMap<R>(mapper: Mapper<T, Iterable<R>>): IIterableLinq<R>;

	/**
	 * Runs the chain and calls `action` on each value.
	 * If `action` throws, the source is closed and the error propagates.
	 * @operation `Action`
	 * @param action called with each value and its index
	 * @returns `unit()`
	 * @example
	 * IterableLinq.from([1, 2]).forEach(v => { console.log(v); return unit(); });
	 */
	forEach(action: Action<T>): Unit;

	/**
	 * Runs the chain and calls the async `action` on each value.
	 * Every action starts during the iteration, so they run in parallel; the returned promise settles when all of them have settled.
	 * @operation `Action`
	 * @param action called with each value and its index; returns a promise
	 * @returns a promise resolved with `unit()`, or rejected with the first error
	 */
	forEachAsync(action: AsyncAction<T>): Promise<Unit>;

	/**
	 * Transforms each value with `mapper`.
	 * @operation `Transformation`
	 * @param mapper called with each value and its index
	 * @returns a new chain with the mapped values
	 * @example
	 * IterableLinq.from([1, 2, 3, 4]).map(v => v * 10).collectToArray(); // [10, 20, 30, 40]
	 */
	map<R>(mapper: Mapper<T, R>): IIterableLinq<R>;

	/**
	 * Runs the chain immediately and stores its values, so later chains start from the stored values.
	 * @operation `Action`
	 * @returns a new chain over the stored values
	 * @example
	 * const stored = IterableLinq.fromRange(1_000_000).filter(isPrime).materialize();
	 */
	materialize(): IIterableLinq<T>;

	/**
	 * Runs the chain and returns its greatest value. Among equal values the first one wins;
	 * `null` and `undefined` never win against a defined value.
	 * @operation `Action`
	 * @param comparer a compare function, a key, or a list of keys to compare by; defaults to `<`
	 * @returns the greatest value, or `undefined` when the chain is empty
	 * @example
	 * IterableLinq.from([{ v: 1 }, { v: 3 }]).max('v'); // { v: 3 }
	 */
	max(comparer?: Comparer<T>): T | undefined;

	/**
	 * Caches the values the first time they are read, so later runs do not re-run the chain.
	 * With partial memoization (the default) the cache fills as far as consumers read;
	 * a consumer that stops early keeps the source open until another consumer finishes it.
	 * If the source throws, every later read past the cached values throws the same error.
	 * @operation `Transformation`
	 * @param options `allowPartialMemoization: false` reads the whole source on the first read
	 * @returns a new chain backed by the cache
	 */
	memoize(options?: IMemoizeOptions): IIterableLinq<T>;

	/**
	 * Runs the chain and returns its smallest value. Among equal values the first one wins;
	 * `null` and `undefined` never win against a defined value.
	 * @operation `Action`
	 * @param comparer a compare function, a key, or a list of keys to compare by; defaults to `<`
	 * @returns the smallest value, or `undefined` when the chain is empty
	 * @example
	 * IterableLinq.from([3, 1, 2]).min(); // 1
	 */
	min(comparer?: Comparer<T>): T | undefined;

	/**
	 * Runs the chain and accumulates its values into a single result.
	 * @operation `Action`
	 * @param neutralElement the initial accumulator (the seed)
	 * @param reducer called with the accumulator, each value and its index; returns the new accumulator
	 * @returns the final accumulator; `neutralElement` when the chain is empty
	 * @example
	 * IterableLinq.from([1, 2, 3]).reduce(0, (acc, v) => acc + v); // 6
	 */
	reduce<R>(neutralElement: R, reducer: Reducer<T, R>): R;

	/**
	 * Runs the chain until a value satisfies `predicate`, then stops and closes the source.
	 * @operation `Action`
	 * @param predicate called with each value and its index
	 * @returns `true` if at least one value satisfies `predicate`
	 * @example
	 * IterableLinq.from([1, 2, 3]).some(v => v > 2); // true
	 */
	some(predicate: Predicate<T>): boolean;

	/**
	 * Calls `tapper` on each value as it flows through the chain, without changing it.
	 * @operation `Tap`
	 * @param tapper called with each value and its index
	 * @returns a new chain with the same values
	 */
	tap(tapper: Tapper<T>): IIterableLinq<T>;

	/**
	 * Calls `tapper` with the upstream `Iterable` each time the chain starts a run.
	 * @operation `Tap`
	 * @param tapper called with the upstream iterable (the index is always 0)
	 * @returns a new chain with the same values
	 */
	tapChain(tapper: Tapper<Iterable<T>>): IIterableLinq<T>;

	/**
	 * Calls `chainCreationTapper` immediately with this chain, while the chain is being built.
	 * @operation `Tap`
	 * @param chainCreationTapper called once, now, with this chain
	 * @returns this same chain
	 */
	tapChainCreation(chainCreationTapper: (iterableLinqWrapper: IIterableLinq<T>) => Unit): IIterableLinq<T>;
}

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
