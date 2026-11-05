import { SortedIterable } from '../iterators';
import type { Comparer, ISortOptions } from '../types';
import { isFunction, libraryError, Validations } from '../utils';

/**
 * Lazily yields the values in ascending order, compared with `<`. The sort is stable, and unlike `Array.prototype.sort`
 * the source is not changed, like `Array.prototype.toSorted`; numbers are compared as numbers, not as strings.
 * `null`, `undefined` and `NaN` go last, in the order of the source.
 * The whole source is read before the first value is yielded, so `sort` does not end on an infinite source.
 * Every iteration reads the source again.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param options - `descending: true` sorts from the greatest to the smallest value
 * @returns a lazy, re-runnable `Iterable` of the sorted values
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `options` is not valid
 * @example
 * ```ts
 * Array.from(Functions.sort([3, 1, 2])); // [1, 2, 3]
 * Array.from(Functions.sort([3, 1, 2], { descending: true })); // [3, 2, 1]
 * ```
 * @since 0.13.0
 */
export function sort<T>(iterable: Iterable<T>, options?: ISortOptions): Iterable<T>;
/**
 * Lazily yields the values sorted by `compare`, which decides the order and its direction. The sort is stable, and unlike
 * `Array.prototype.sort` the source is not changed. `undefined` values go last without calling `compare`, as in
 * `Array.prototype.sort`.
 * The whole source is read before the first value is yielded, so `sort` does not end on an infinite source.
 * Every iteration reads the source again.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param compare - `(a, b) => number`: negative if `a` comes before `b`, `0` if they are equal, positive if `a` comes after `b`
 * @returns a lazy, re-runnable `Iterable` of the sorted values
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if options are given too
 * @example
 * ```ts
 * Array.from(Functions.sort(words, (a, b) => a.localeCompare(b)));
 * Array.from(Functions.sort([1, 3, 2], (a, b) => b - a)); // [3, 2, 1]
 * ```
 * @since 0.13.0
 */
export function sort<T>(iterable: Iterable<T>, compare: (a: T, b: T) => number): Iterable<T>;
/**
 * Lazily yields the values sorted by a key, compared with `<`, or by a list of keys where the next key breaks the ties of
 * the previous one. The sort is stable, and unlike `Array.prototype.sort` the source is not changed.
 * The values whose key is `null`, `undefined` or `NaN`, and the `null` and `undefined` values, go last, in the order of the
 * source; with a list of keys the rule applies at each key.
 * The whole source is read before the first value is yielded, so `sort` does not end on an infinite source.
 * Every iteration reads the source again.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param keys - a key, or a non-empty list of keys
 * @param options - `descending: true` inverts the comparison; the equal values keep the order of the source
 * @returns a lazy, re-runnable `Iterable` of the sorted values
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, if `keys` is not a key or a non-empty
 * list of keys, or if `options` is not valid
 * @example
 * ```ts
 * Array.from(Functions.sort(people, 'age'));
 * Array.from(Functions.sort(people, ['lastName', 'firstName'], { descending: true }));
 * ```
 * @since 0.13.0
 */
export function sort<T>(iterable: Iterable<T>, keys: keyof T | Array<keyof T>, options?: ISortOptions): Iterable<T>;
export function sort<T>(iterable: Iterable<T>, comparerOrOptions?: Comparer<T> | ISortOptions, options?: ISortOptions): Iterable<T> {
	Validations.throwIfNotIterable(iterable, 'iterable', 'sort');
	let comparer: Comparer<T> | undefined;
	let sortOptions: ISortOptions | undefined;
	if (options !== undefined) {
		// with options, the argument before them is a key or a list of keys
		Validations.throwIfNotComparer(comparerOrOptions, 'comparer', 'sort');
		if (isFunction(comparerOrOptions))
			throw libraryError('sort', 'The "options" cannot be given with a compare function, which decides the order');
		comparer = comparerOrOptions as Comparer<T>;
		sortOptions = options;
	} else if (isOptions(comparerOrOptions)) {
		sortOptions = comparerOrOptions;
	} else if (comparerOrOptions !== undefined) {
		Validations.throwIfNotComparer(comparerOrOptions, 'comparer', 'sort');
		comparer = comparerOrOptions;
	}
	if (sortOptions !== undefined) {
		Validations.throwIfNotObject(sortOptions, 'options', 'sort');
		if (sortOptions.descending !== undefined)
			Validations.throwIfNotBoolean(sortOptions.descending, 'descending', 'sort');
	}
	const descending = sortOptions?.descending === true;
	return new SortedIterable(iterable, comparer, descending, 0);
}

/** The options are an object that is not a list of keys; a compare function is not an object. */
function isOptions<T>(value: Comparer<T> | ISortOptions | undefined): value is ISortOptions {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}
