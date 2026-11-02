import { DeferredIterable, SourceIterator } from '../iterators';
import type { Comparer, ISortOptions } from '../types';
import { compareValues, getContinueIteratorResult, getDoneIteratorResult, isFunction, isPropertyKey, Validations } from '../utils';

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
 * @since next
 */
export function sort<T>(iterable: Iterable<T>, options?: ISortOptions): Iterable<T>;
/**
 * Lazily yields the values sorted by `comparer`: a compare function, a key, or a list of keys where the next key breaks the
 * ties of the previous one. The sort is stable, and unlike `Array.prototype.sort` the source is not changed.
 * With a key, the values whose key is `null`, `undefined` or `NaN`, and the `null` and `undefined` values, go last, in the
 * order of the source; with a list of keys the rule applies at each key. A compare function decides the order of every value
 * but `undefined`, which goes last.
 * The whole source is read before the first value is yielded, so `sort` does not end on an infinite source.
 * Every iteration reads the source again.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param comparer - how to compare two values: `(a, b) => number`, a key or a list of keys
 * @param options - `descending: true` inverts the comparison; the equal values keep the order of the source
 * @returns a lazy, re-runnable `Iterable` of the sorted values
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, if `comparer` is not a function, a key or
 * a non-empty list of keys, or if `options` is not valid
 * @example
 * ```ts
 * Array.from(Functions.sort(people, 'age'));
 * Array.from(Functions.sort(people, ['lastName', 'firstName'], { descending: true }));
 * Array.from(Functions.sort(words, (a, b) => a.localeCompare(b)));
 * ```
 * @since next
 */
export function sort<T>(iterable: Iterable<T>, comparer: Comparer<T>, options?: ISortOptions): Iterable<T>;
export function sort<T>(iterable: Iterable<T>, comparerOrOptions?: Comparer<T> | ISortOptions, options?: ISortOptions): Iterable<T> {
	Validations.throwIfNotIterable(iterable, 'sort');
	const comparer = isOptions(comparerOrOptions) ? undefined : comparerOrOptions;
	const sortOptions = isOptions(comparerOrOptions) ? comparerOrOptions : options;
	if (comparer !== undefined)
		Validations.throwIfNotComparer(comparer, 'comparer', 'sort');
	if (sortOptions !== undefined) {
		Validations.throwIfNotObject(sortOptions, 'options', 'sort');
		if (sortOptions.descending !== undefined)
			Validations.throwIfNotBoolean(sortOptions.descending, 'descending', 'sort');
	}
	const descending = sortOptions?.descending === true;
	return new DeferredIterable(() => new SortIterator(iterable, comparer, descending));
}

/** The options are an object that is not a list of keys; a compare function is not an object. */
function isOptions<T>(value: Comparer<T> | ISortOptions | undefined): value is ISortOptions {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** `null`, `undefined` and `NaN` have no place in the order: they go last. */
function isMissing(value: unknown): boolean {
	return value == null || value !== value;
}

class SortIterator<T> extends SourceIterator<T, T> {
	/** The sorted values, read on the first `next()`. */
	private sorted?: T[];
	private position = 0;

	constructor(iterable: Iterable<T>, private readonly comparer: Comparer<T> | undefined, private readonly descending: boolean) {
		super(iterable);
	}

	protected advance(): IteratorResult<T> {
		this.sorted ??= this.fill();
		return this.position < this.sorted.length ? getContinueIteratorResult(this.sorted[this.position++]) : getDoneIteratorResult();
	}

	protected override onReturn(value?: any): void {
		this.sorted = undefined;
		super.onReturn(value);
	}

	/**
	 * Reads the whole source, then sorts it. An error of the source propagates as it is; an error of the compare function or
	 * of a key closes the iterator first.
	 */
	private fill(): T[] {
		const values: T[] = [];
		for (let n = this.source.next(); n.done !== true; n = this.source.next())
			values.push(n.value);
		try {
			return sortValues(values, this.comparer, this.descending);
		} catch (error) {
			this.closeAfterCallbackError();
			throw error;
		}
	}
}

/** Sorts `values`, which the caller owns, choosing the strategy once, outside the comparisons. */
function sortValues<T>(values: T[], comparer: Comparer<T> | undefined, descending: boolean): T[] {
	if (comparer === undefined)
		return byValue(values, descending);
	if (isFunction(comparer))
		return values.sort(descending ? (a, b) => comparer(b, a) : comparer);
	if (isPropertyKey(comparer))
		return byKey(values, comparer, descending);
	return byKeys(values, comparer as PropertyKey[], descending);
}

function byValue<T>(values: T[], descending: boolean): T[] {
	const present: T[] = [];
	const missing: T[] = [];
	for (const value of values)
		(isMissing(value) ? missing : present).push(value);
	present.sort(descending ? (a, b) => compareValues(b, a) : compareValues);
	for (const value of missing)
		present.push(value);
	return present;
}

/** Reads the key of each value once, sorts the indices of the present keys, then appends the missing ones. */
function byKey<T>(values: T[], key: PropertyKey, descending: boolean): T[] {
	const keys = keysOf(values, key);
	const present: number[] = [];
	const missing: number[] = [];
	for (let i = 0; i < values.length; i++)
		(isMissing(keys[i]) ? missing : present).push(i);
	present.sort(descending ? (i, j) => compareValues(keys[j], keys[i]) : (i, j) => compareValues(keys[i], keys[j]));
	const sorted: T[] = [];
	for (const i of present)
		sorted.push(values[i]);
	for (const i of missing)
		sorted.push(values[i]);
	return sorted;
}

/** Reads each key of each value once; at each key a missing value goes after a present one, in both directions. */
function byKeys<T>(values: T[], names: PropertyKey[], descending: boolean): T[] {
	const columns = names.map(name => keysOf(values, name));
	const sign = descending ? -1 : 1;
	const indices: number[] = [];
	for (let i = 0; i < values.length; i++)
		indices.push(i);
	indices.sort((i, j) => {
		for (const keys of columns) {
			const a = keys[i];
			const b = keys[j];
			const aMissing = isMissing(a);
			const bMissing = isMissing(b);
			if (aMissing || bMissing) {
				if (aMissing && bMissing)
					continue;
				return aMissing ? 1 : -1;
			}
			const result = compareValues(a, b);
			if (result !== 0)
				return sign * result;
		}
		return 0;
	});
	return indices.map(i => values[i]);
}

/** The key of each value; a `null` or `undefined` value has none. */
function keysOf<T>(values: T[], key: PropertyKey): unknown[] {
	const keys: unknown[] = new Array(values.length);
	for (let i = 0; i < values.length; i++) {
		const value = values[i];
		keys[i] = value == null ? undefined : (value as any)[key];
	}
	return keys;
}
