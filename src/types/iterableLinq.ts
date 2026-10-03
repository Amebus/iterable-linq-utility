import type { Action, AsyncAction } from './action';
import type { Comparer } from './comparer';
import type { Mapper } from './mapper';
import type { IMemoizeOptions } from './memoizeOptions';
import type { Predicate } from './predicate';
import type { Reducer } from './reducer';
import type { Tapper } from './tapper';
import type { Unit } from './unit';

/**
 * The operations provided by the library on every chain. See `IIterableLinq`.
 * @since 0.1.0
 */
export interface IIterableLinqBase<T> {

	/**
	 * Starts a new run of the chain. Each call iterates the source again, so a chain can be consumed many times.
	 * @returns a new iterator over the values of the chain
	 * @example
	 * ```ts
	 * const chain = IterableLinq.from([1, 2, 3]).map(v => v * 10);
	 * [...chain]; // [10, 20, 30]
	 * for (const value of chain) console.log(value); // 10, 20, 30
	 * ```
	 * @since 0.0.1
	 */
	[Symbol.iterator](): Iterator<T, any, undefined>;

	/**
	 * Runs the chain and collects its values into an `Array`.
	 * @operation `Action`
	 * @returns the values of the chain, in order; an empty array when the chain is empty
	 * @example
	 * ```ts
	 * IterableLinq.from([1, 2, 3]).map(v => v * 10).collectToArray(); // [10, 20, 30]
	 * ```
	 * @since 0.0.1
	 */
	collectToArray(): T[];

	/**
	 * Counts the values of the chain; runs the whole chain.
	 * @operation `Action`
	 * @returns the number of values in the chain
	 * @example
	 * ```ts
	 * IterableLinq.from([1, 2, 3]).count(); // 3
	 * ```
	 * @since 0.5.0
	 */
	count(): number;

	/**
	 * Counts the values that satisfy `predicate`; runs the whole chain.
	 * If `predicate` throws, the source is closed and the error propagates.
	 * @operation `Action`
	 * @param predicate - called with each value and its index; `undefined` counts every value
	 * @returns the number of values that satisfy `predicate`
	 * @throws Error if a provided `predicate` is not a function
	 * @example
	 * ```ts
	 * IterableLinq.from([1, 5, 2, 6]).count(v => v > 4); // 2
	 * ```
	 * @since 0.5.0
	 */
	count(predicate: Predicate<T> | undefined): number;

	/**
	 * Yields the first value for each distinct value or selected key, in source order.
	 * Keys use `SameValueZero`, like `Set`; original values are preserved.
	 * Each iteration stores its own seen keys. If `keySelector` throws, the source is closed and the error propagates.
	 * @operation `Transformation`
	 * @param keySelector - called with every source value and its index; omitted or `undefined` compares values directly
	 * @returns a new lazy, re-runnable chain of the first values for each key
	 * @throws Error if a provided `keySelector` is not a function
	 * @example
	 * ```ts
	 * IterableLinq.from([3, 1, 3, 2, 1]).distinct().collectToArray(); // [3, 1, 2]
	 * IterableLinq.from([{ id: 1 }, { id: 1 }, { id: 2 }]).distinct(v => v.id).collectToArray(); // [{ id: 1 }, { id: 2 }]
	 * ```
	 * @since 0.5.0
	 */
	distinct<K>(keySelector?: Mapper<T, K>): IIterableLinq<T>;

	/**
	 * Tells whether every value satisfies `predicate`; stops and closes the source at the first rejected value.
	 * @operation `Action`
	 * @param predicate - called with each value and its index
	 * @returns `true` if every value satisfies `predicate`, or if the chain is empty; `false` otherwise
	 * @throws Error if `predicate` is not a function
	 * @example
	 * ```ts
	 * IterableLinq.from([1, 2, 3]).every(v => v > 0); // true
	 * ```
	 * @since 0.5.0
	 */
	every(predicate: Predicate<T>): boolean;

	/**
	 * Keeps the values accepted by a type guard and narrows their type.
	 * If `predicate` throws, the source is closed and the error propagates.
	 * @operation `Transformation`
	 * @param predicate - a type guard called with each value and its index; return `true` to keep the value
	 * @returns a new chain with the narrowed values
	 * @throws Error if `predicate` is not a function
	 * @example
	 * ```ts
	 * const values: (number | string)[] = [1, 'two', 3];
	 * IterableLinq.from(values).filter((v): v is string => typeof v === 'string').collectToArray(); // string[], ['two']
	 * ```
	 * @since 0.4.0
	 */
	filter<S extends T>(predicate: (value: T, index: number) => value is S): IIterableLinq<S>;

	/**
	 * Keeps only the values that satisfy `predicate`.
	 * If `predicate` throws, the source is closed and the error propagates.
	 * @operation `Transformation`
	 * @param predicate - called with each value and its index; return `true` to keep the value
	 * @returns a new chain with the kept values
	 * @throws Error if `predicate` is not a function
	 * @example
	 * ```ts
	 * IterableLinq.from([1, 2, 3, 4]).filter(v => v % 2 === 0).collectToArray(); // [2, 4]
	 * ```
	 * @since 0.0.1
	 */
	filter(predicate: Predicate<T>): IIterableLinq<T>;

	/**
	 * Returns the first value accepted by a type guard, narrowing its type; stops and closes the source at the first match.
	 * @operation `Action`
	 * @param predicate - a type guard called with each value and its index
	 * @returns the first value accepted by `predicate`, or `undefined` if there is none
	 * @throws Error if `predicate` is not a function
	 * @example
	 * ```ts
	 * const values: (number | string)[] = [1, 'two', 3];
	 * IterableLinq.from(values).find((v): v is string => typeof v === 'string'); // string | undefined, 'two'
	 * ```
	 * @since 0.5.0
	 */
	find<S extends T>(predicate: (value: T, index: number) => value is S): S | undefined;

	/**
	 * Returns the first value that satisfies `predicate`; stops and closes the source at the first match.
	 * @operation `Action`
	 * @param predicate - called with each value and its index
	 * @returns the first value that satisfies `predicate`, or `undefined` if there is none
	 * @throws Error if `predicate` is not a function
	 * @example
	 * ```ts
	 * IterableLinq.from([1, 5, 6]).find(v => v > 4); // 5
	 * ```
	 * @since 0.5.0
	 */
	find(predicate: Predicate<T>): T | undefined;

	/**
	 * Returns the index of the first value that satisfies `predicate`; stops and closes the source at the first match.
	 * @operation `Action`
	 * @param predicate - called with each value and its index
	 * @returns the index of the first value that satisfies `predicate`, or `-1` if there is none
	 * @throws Error if `predicate` is not a function
	 * @example
	 * ```ts
	 * IterableLinq.from([1, 5, 6]).findIndex(v => v > 4); // 1
	 * ```
	 * @since 0.5.0
	 */
	findIndex(predicate: Predicate<T>): number;

	/**
	 * Returns the last value accepted by a type guard, narrowing its type; runs the whole chain.
	 * If `predicate` throws, the source is closed and the error propagates.
	 * @operation `Action`
	 * @param predicate - a type guard called with each value and its index
	 * @returns the last value accepted by `predicate`, or `undefined` if there is none
	 * @throws Error if `predicate` is not a function
	 * @example
	 * ```ts
	 * const values: (number | string)[] = [1, 'two', 3, 'four'];
	 * IterableLinq.from(values).findLast((v): v is string => typeof v === 'string'); // string | undefined, 'four'
	 * ```
	 * @since next
	 */
	findLast<S extends T>(predicate: (value: T, index: number) => value is S): S | undefined;

	/**
	 * Returns the last value that satisfies `predicate`; runs the whole chain.
	 * If `predicate` throws, the source is closed and the error propagates.
	 * @operation `Action`
	 * @param predicate - called with each value and its index
	 * @returns the last value that satisfies `predicate`, or `undefined` if there is none
	 * @throws Error if `predicate` is not a function
	 * @example
	 * ```ts
	 * IterableLinq.from([1, 5, 6, 2]).findLast(v => v > 4); // 6
	 * ```
	 * @since next
	 */
	findLast(predicate: Predicate<T>): T | undefined;

	/**
	 * Maps each value to an `Iterable` and flattens the results into one chain.
	 * Each inner `Iterable` is read completely before the next value of the chain is mapped.
	 * Inner arrays are read by index, as in `Array.prototype.flatMap`: their `[Symbol.iterator]` is not called.
	 * If `mapper` or an inner `Iterable` throws, the source is closed and the error propagates.
	 * @operation `Transformation`
	 * @param mapper - called with each value and its index; returns the `Iterable` to flatten
	 * @returns a new chain with the flattened values
	 * @throws Error if `mapper` is not a function
	 * @example
	 * ```ts
	 * IterableLinq.from([1, 2]).flatMap(v => [v, v * 10]).collectToArray(); // [1, 10, 2, 20]
	 * ```
	 * @since 0.0.11
	 */
	flatMap<R>(mapper: Mapper<T, Iterable<R>>): IIterableLinq<R>;

	/**
	 * Runs the chain and calls `action` on each value.
	 * If `action` throws, the source is closed and the error propagates.
	 * @operation `Action`
	 * @param action - called with each value and its index; returns `unit()`
	 * @returns `unit()`
	 * @throws Error if `action` is not a function
	 * @example
	 * ```ts
	 * IterableLinq.from([1, 2]).forEach(v => {
	 * 	console.log(v); // 1, 2
	 * 	return unit();
	 * });
	 * ```
	 * @since 0.0.11
	 */
	forEach(action: Action<T>): Unit;

	/**
	 * Runs the chain and calls the async `action` on each value.
	 * The actions run sequentially: each one starts after the previous one has settled.
	 * The first rejection stops the iteration and closes the source. Works on infinite sources.
	 * @operation `Action`
	 * @param action - called with each value and its index; returns a promise of `unit()`
	 * @returns a promise resolved with `unit()` after the last action, or rejected with the first error
	 * @throws Error, as a rejection of the returned promise, if `action` is not a function
	 * @example
	 * ```ts
	 * await IterableLinq.from(['a.txt', 'b.txt']).forEachAsync(async file => {
	 * 	await upload(file); // 'b.txt' starts after 'a.txt' has finished
	 * 	return unit();
	 * });
	 * ```
	 * @since 0.0.11
	 */
	forEachAsync(action: AsyncAction<T>): Promise<Unit>;

	/**
	 * Tells whether the chain contains `value`, compared with `SameValueZero` like `Array.prototype.includes`;
	 * stops and closes the source at the first match.
	 * @operation `Action`
	 * @param value - the value to look for; `NaN` matches `NaN`, and `+0` matches `-0`
	 * @returns `true` if the chain contains `value`; `false` otherwise
	 * @example
	 * ```ts
	 * IterableLinq.from([1, 2, NaN]).includes(NaN); // true
	 * ```
	 * @since 0.5.0
	 */
	includes(value: T): boolean;

	/**
	 * Returns the index of the first value strictly equal (`===`) to `value`, like `Array.prototype.indexOf`;
	 * stops and closes the source at the first match.
	 * @operation `Action`
	 * @param value - the value to look for; `NaN` is never found, use `includes` or `findIndex` for it
	 * @returns the index of the first value equal to `value`, or `-1` if there is none
	 * @example
	 * ```ts
	 * IterableLinq.from([1, 2, 3, 2]).indexOf(2); // 1
	 * ```
	 * @since next
	 */
	indexOf(value: T): number;

	/**
	 * Returns the index of the last value strictly equal (`===`) to `value`, like `Array.prototype.lastIndexOf`;
	 * runs the whole chain.
	 * @operation `Action`
	 * @param value - the value to look for; `NaN` is never found, use `findLastIndex` for it
	 * @returns the index of the last value equal to `value`, or `-1` if there is none
	 * @example
	 * ```ts
	 * IterableLinq.from([1, 2, 3, 2]).lastIndexOf(2); // 3
	 * ```
	 * @since next
	 */
	lastIndexOf(value: T): number;

	/**
	 * Transforms each value with `mapper`.
	 * If `mapper` throws, the source is closed and the error propagates.
	 * @operation `Transformation`
	 * @param mapper - called with each value and its index; returns the new value
	 * @returns a new chain with the mapped values
	 * @throws Error if `mapper` is not a function
	 * @example
	 * ```ts
	 * IterableLinq.from([1, 2, 3, 4]).map(v => v * 10).collectToArray(); // [10, 20, 30, 40]
	 * ```
	 * @since 0.0.1
	 */
	map<R>(mapper: Mapper<T, R>): IIterableLinq<R>;

	/**
	 * Runs the chain immediately and stores its values, so later chains start from the stored values
	 * instead of running the source again. Materializing a materialized chain does not copy the values again.
	 * @operation `Action`
	 * @returns a new chain over the stored values
	 * @example
	 * ```ts
	 * const stored = IterableLinq.fromRange(1_000_000).filter(isPrime).materialize(); // runs now
	 * stored.max(); // reads the stored values, does not run filter again
	 * ```
	 * @since 0.0.1
	 */
	materialize(): IIterableLinq<T>;

	/**
	 * Runs the chain and returns its greatest value. Among equal values the first one wins;
	 * `null` and `undefined` never win against a defined value.
	 * @operation `Action`
	 * @param comparer - a compare function, a key, or a list of keys to compare by; defaults to `<`
	 * @returns the greatest value, or `undefined` when the chain is empty
	 * @example
	 * ```ts
	 * IterableLinq.from([3, 1, 2]).max(); // 3
	 * IterableLinq.from([{ v: 1 }, { v: 3 }]).max('v'); // { v: 3 }
	 * IterableLinq.empty<number>().max(); // undefined
	 * ```
	 * @since 0.0.1
	 */
	max(comparer?: Comparer<T>): T | undefined;

	/**
	 * Caches the values the first time they are read, so later runs do not run the chain again.
	 * With partial memoization (the default) the cache fills as far as consumers read;
	 * a consumer that stops early keeps the source open until another consumer finishes it.
	 * If the source throws, every later read past the cached values throws the same error.
	 * @operation `Transformation`
	 * @param options - `allowPartialMemoization: false` reads the whole source on the first read
	 * @returns a new chain backed by the cache
	 * @example
	 * ```ts
	 * const cached = IterableLinq.from(readLines()).map(parse).memoize();
	 * cached.collectToArray(); // reads and parses the lines
	 * cached.collectToArray(); // same values, from the cache
	 * ```
	 * @since 0.0.1
	 */
	memoize(options?: IMemoizeOptions): IIterableLinq<T>;

	/**
	 * Runs the chain and returns its smallest value. Among equal values the first one wins;
	 * `null` and `undefined` never win against a defined value.
	 * @operation `Action`
	 * @param comparer - a compare function, a key, or a list of keys to compare by; defaults to `<`
	 * @returns the smallest value, or `undefined` when the chain is empty
	 * @example
	 * ```ts
	 * IterableLinq.from([3, 1, 2]).min(); // 1
	 * IterableLinq.from([{ v: 1 }, { v: 3 }]).min('v'); // { v: 1 }
	 * IterableLinq.empty<number>().min(); // undefined
	 * ```
	 * @since 0.0.8
	 */
	min(comparer?: Comparer<T>): T | undefined;

	/**
	 * Runs the chain and accumulates its values into a single result, starting from the first value.
	 * @operation `Action`
	 * @param reducer - called with the accumulator, each value from the second one and its index (starting at 1); returns the new accumulator
	 * @returns the final accumulator; the only value when the chain has one value, without calling `reducer`
	 * @throws Error if the chain is empty or if `reducer` is not a function
	 * @example
	 * ```ts
	 * IterableLinq.from([3, 7, 2]).reduce((acc, v) => (v > acc ? v : acc)); // 7
	 * ```
	 * @since 0.2.0
	 */
	reduce(reducer: Reducer<T, T>): T;

	/**
	 * Runs the chain and accumulates its values into a single result.
	 * @operation `Action`
	 * @param neutralElement - the initial accumulator (the seed)
	 * @param reducer - called with the accumulator, each value and its index; returns the new accumulator
	 * @returns the final accumulator; `neutralElement` when the chain is empty
	 * @throws Error if `reducer` is not a function
	 * @example
	 * ```ts
	 * IterableLinq.from([1, 2, 3]).reduce(0, (acc, v) => acc + v); // 6
	 * ```
	 * @since 0.0.10
	 */
	reduce<R>(neutralElement: R, reducer: Reducer<T, R>): R;

	/**
	 * Lazily skips the first `count` values and yields the rest.
	 * @operation `Transformation`
	 * @param count - how many values to skip; must be a non-negative integer
	 * @returns a lazy, re-runnable chain of the remaining values
	 * @throws Error if `count` is negative, not an integer, `NaN` or `Infinity`
	 * @example
	 * ```ts
	 * IterableLinq.from([1, 2, 3, 4, 5]).skip(2).collectToArray(); // [3, 4, 5]
	 * ```
	 * @since 0.3.0
	 */
	skip(count: number): IIterableLinq<T>;

	/**
	 * Skips the values while `predicate` returns `true`, then yields the first rejected value and all the rest.
	 * After the first rejected value, `predicate` is not called again.
	 * If `predicate` throws, the source is closed and the error propagates.
	 * @operation `Transformation`
	 * @param predicate - called with each value and its index until it returns `false`
	 * @returns a new chain of the values from the first rejected one
	 * @throws Error if `predicate` is not a function
	 * @example
	 * ```ts
	 * IterableLinq.from([1, 2, 5, 3]).skipWhile(v => v < 4).collectToArray(); // [5, 3]
	 * ```
	 * @since 0.5.0
	 */
	skipWhile(predicate: Predicate<T>): IIterableLinq<T>;

	/**
	 * Runs the chain until its first value, then stops and closes the source.
	 * @operation `Action`
	 * @returns `true` if the chain contains a value; `false` when it is empty
	 * @example
	 * ```ts
	 * IterableLinq.from([1, 2, 3]).some(); // true
	 * ```
	 * @since 0.3.0
	 */
	some(): boolean;

	/**
	 * Runs the chain until a value satisfies `predicate`, then stops and closes the source.
	 * @operation `Action`
	 * @param predicate - called with each value and its index; `undefined` checks only whether a value exists
	 * @returns `true` if at least one value satisfies `predicate`; `false` otherwise
	 * @throws Error if a provided `predicate` is not a function
	 * @example
	 * ```ts
	 * IterableLinq.from([1, 2, 3]).some(v => v > 2); // true
	 * ```
	 * @since 0.0.1
	 */
	some(predicate: Predicate<T> | undefined): boolean;

	/**
	 * Yields the first `count` values, then closes the source.
	 * The source is never read past the `count`-th value, so `take` also ends an infinite chain.
	 * @operation `Transformation`
	 * @param count - how many values to yield; must be a non-negative integer
	 * @returns a new chain with at most `count` values
	 * @throws Error if `count` is negative, not an integer, `NaN` or `Infinity`
	 * @example
	 * ```ts
	 * IterableLinq.from([1, 2, 3, 4, 5]).take(3).collectToArray(); // [1, 2, 3]
	 * ```
	 * @since 0.3.0
	 */
	take(count: number): IIterableLinq<T>;

	/**
	 * Yields the values while a type guard accepts them, narrowing their type, then closes the source.
	 * The source is never read past the first rejected value, which is not yielded.
	 * If `predicate` throws, the source is closed and the error propagates.
	 * @operation `Transformation`
	 * @param predicate - a type guard called with each value and its index; the first `false` ends the chain
	 * @returns a new chain of the narrowed values before the first rejected one
	 * @throws Error if `predicate` is not a function
	 * @example
	 * ```ts
	 * const values: (number | string)[] = [1, 2, 'three', 4];
	 * IterableLinq.from(values).takeWhile((v): v is number => typeof v === 'number').collectToArray(); // number[], [1, 2]
	 * ```
	 * @since 0.5.0
	 */
	takeWhile<S extends T>(predicate: (value: T, index: number) => value is S): IIterableLinq<S>;

	/**
	 * Yields the values while `predicate` returns `true`, then closes the source.
	 * The source is never read past the first rejected value, which is not yielded, so `takeWhile` can end an infinite chain.
	 * If `predicate` throws, the source is closed and the error propagates.
	 * @operation `Transformation`
	 * @param predicate - called with each value and its index; the first `false` ends the chain
	 * @returns a new chain of the values before the first rejected one
	 * @throws Error if `predicate` is not a function
	 * @example
	 * ```ts
	 * IterableLinq.from([1, 2, 5, 3]).takeWhile(v => v < 4).collectToArray(); // [1, 2]
	 * ```
	 * @since 0.5.0
	 */
	takeWhile(predicate: Predicate<T>): IIterableLinq<T>;

	/**
	 * Calls `tapper` on each value as it flows through the chain, without changing it.
	 * If `tapper` throws, the source is closed and the error propagates.
	 * `tapper` runs only when the chain runs, once per value and per run.
	 * @operation `Tap`
	 * @param tapper - called with each value and its index; returns `unit()`
	 * @returns a new chain with the same values
	 * @throws Error if `tapper` is not a function
	 * @example
	 * ```ts
	 * IterableLinq.from([1, 2])
	 * 	.tap(v => { console.log('read', v); return unit(); })
	 * 	.map(v => v * 10)
	 * 	.collectToArray(); // logs "read 1", "read 2"; returns [10, 20]
	 * ```
	 * @since 0.0.10
	 */
	tap(tapper: Tapper<T>): IIterableLinq<T>;

	/**
	 * Calls `tapper` with the upstream `Iterable` each time the chain starts a run, before the first value is read.
	 * @operation `Tap`
	 * @param tapper - called with the upstream `Iterable` (the index is always 0); returns `unit()`
	 * @returns a new chain with the same values
	 * @throws Error if `tapper` is not a function
	 * @example
	 * ```ts
	 * const chain = IterableLinq.from([1, 2]).tapChain(() => { console.log('run'); return unit(); });
	 * chain.collectToArray(); // logs "run"
	 * chain.collectToArray(); // logs "run" again
	 * ```
	 * @since 0.0.10
	 */
	tapChain(tapper: Tapper<Iterable<T>>): IIterableLinq<T>;

	/**
	 * Calls `chainCreationTapper` immediately with this chain, while the chain is being built. Nothing runs.
	 * @operation `Tap`
	 * @param chainCreationTapper - called once, now, with this chain; returns `unit()`
	 * @returns this same chain
	 * @throws Error if `chainCreationTapper` is not a function
	 * @example
	 * ```ts
	 * let evens: IIterableLinq<number> | undefined;
	 * const evensByTen = IterableLinq.fromRange(10)
	 * 	.filter(v => v % 2 === 0)
	 * 	.tapChainCreation(chain => { evens = chain; return unit(); })
	 * 	.map(v => v * 10);
	 * evens?.collectToArray(); // [0, 2, 4, 6, 8]
	 * evensByTen.collectToArray(); // [0, 20, 40, 60, 80]
	 * ```
	 * @since 0.0.10
	 */
	tapChainCreation(chainCreationTapper: (chain: IIterableLinq<T>) => Unit): IIterableLinq<T>;
}

/**
 * Fluent wrapper over an `Iterable`: every call builds a lazy, re-runnable operations chain.
 * Transformations and taps return a new `IIterableLinq`; actions run the chain and return a result.
 * Create chains with `from`, `fromRange`, `repeat` and `empty`; recognise them with `isIterableLinq`.
 *
 * Augment this interface (not `IIterableLinqBase`) to declare the methods you add with `extend`.
 * @since 0.0.10
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- augmentation target for extend()
export interface IIterableLinq<T> extends IIterableLinqBase<T> {}
