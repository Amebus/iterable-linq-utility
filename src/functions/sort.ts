import { DeferredIterable, SourceIterator } from '../iterators';
import type { Comparer, ISortOptions } from '../types';
import { getContinueIteratorResult, getDoneIteratorResult, isFunction, isPropertyKey, libraryError, Validations } from '../utils';

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
 * @since next
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
 * @since next
 */
export function sort<T>(iterable: Iterable<T>, keys: keyof T | Array<keyof T>, options?: ISortOptions): Iterable<T>;
export function sort<T>(iterable: Iterable<T>, comparerOrOptions?: Comparer<T> | ISortOptions, options?: ISortOptions): Iterable<T> {
	Validations.throwIfNotIterable(iterable, 'sort');
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
		return values.sort(comparer);
	if (isPropertyKey(comparer))
		return byKey(values, comparer, descending);
	return byKeys(values, comparer as PropertyKey[], descending);
}

const ascendingNumbers = (a: number, b: number): number => a - b;
const descendingNumbers = (a: number, b: number): number => b - a;
/**
 * `<` and `>` both ways: two values that neither precedes are a tie, so equal values that are not the same object (two `Date`s)
 * keep the order of the source, and the next key decides. `===` would tell them apart in both directions.
 */
function compareValues(a: any, b: any): number {
	return a < b ? -1 : a > b ? 1 : 0;
}

const descendingValues = (a: unknown, b: unknown): number => compareValues(b, a);

/** Subtraction when every value is a number, faster than `<` with three outcomes; `Infinity - Infinity` is `NaN`, which the sort reads as equal. */
function compareFor(numbers: boolean, descending: boolean): (a: any, b: any) => number {
	if (numbers)
		return descending ? descendingNumbers : ascendingNumbers;
	return descending ? descendingValues : compareValues;
}

function byValue<T>(values: T[], descending: boolean): T[] {
	const present: T[] = [];
	const missing: T[] = [];
	let numbers = true;
	for (const value of values) {
		if (isMissing(value)) {
			missing.push(value);
		} else {
			present.push(value);
			numbers &&= typeof value === 'number';
		}
	}
	present.sort(compareFor(numbers, descending));
	for (const value of missing)
		present.push(value);
	return present;
}

/**
 * Moves the values whose key is missing out, in one pass, then sorts the others comparing their keys directly: for a property,
 * a read in the comparison is faster than an array of keys and an array of indices.
 */
function byKey<T>(values: T[], key: PropertyKey, descending: boolean): T[] {
	const present: any[] = [];
	const missing: T[] = [];
	let numbers = true;
	for (const value of values) {
		const k = value == null ? undefined : (value as any)[key];
		if (isMissing(k)) {
			missing.push(value);
		} else {
			present.push(value);
			numbers &&= typeof k === 'number';
		}
	}
	present.sort(numbers
		? descending ? (a, b) => b[key] - a[key] : (a, b) => a[key] - b[key]
		: descending ? (a, b) => compareValues(b[key], a[key]) : (a, b) => compareValues(a[key], b[key]));
	for (const value of missing)
		present.push(value);
	return present;
}

/**
 * Without missing keys, the values are compared key by key directly; with one, the keys are read once into one array per key
 * and the indices are sorted, so that a missing key goes after a present one at its level.
 */
function byKeys<T>(values: T[], names: PropertyKey[], descending: boolean): T[] {
	if (names.length === 1)
		return byKey(values, names[0], descending);
	const anyMissing = values.some(value => value == null || names.some(name => isMissing((value as any)[name])));
	if (!anyMissing)
		return values.sort(descending ? (a, b) => compareKeys(b, a, names) : (a, b) => compareKeys(a, b, names));
	const columns = names.map(name => keysOf(values, name));
	const indices: number[] = [];
	for (let i = 0; i < values.length; i++)
		indices.push(i);
	indices.sort(withMissing(columns, descending ? -1 : 1));
	return indices.map(i => values[i]);
}

/** Compares two values key by key; with two keys the reads are written out, which the engine optimises better than a loop. */
function compareKeys(a: any, b: any, names: PropertyKey[]): number {
	if (names.length === 2) {
		const first = names[0];
		let x = a[first];
		let y = b[first];
		if (x < y)
			return -1;
		if (x > y)
			return 1;
		const second = names[1];
		x = a[second];
		y = b[second];
		return x < y ? -1 : x > y ? 1 : 0;
	}
	for (const name of names) {
		const x = a[name];
		const y = b[name];
		if (x < y)
			return -1;
		if (x > y)
			return 1;
	}
	return 0;
}

function withMissing(columns: unknown[][], sign: number): (i: number, j: number) => number {
	return (i, j) => {
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
	};
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
