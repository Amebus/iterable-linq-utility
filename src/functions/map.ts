import { SourceIterator, DeferredIterable } from '../iterators';
import { Mapper } from '../types';
import { getContinueIteratorResult, isPropertyKey, Validations } from '../utils';

/**
 * Lazily transforms each value with `mapper`.
 * If `mapper` throws, the source is closed and the error propagates.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param mapper - called with each value and its index; returns the new value
 * @returns a lazy, re-runnable `Iterable` of the mapped values
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `mapper` is neither a function nor a property key
 * @example
 * ```ts
 * Array.from(Functions.map([1, 2, 3], v => v * 10)); // [10, 20, 30]
 * ```
 * @since 0.0.10
 */
export function map<T, R>(iterable: Iterable<T>, mapper: Mapper<T, R>): Iterable<R>;
/**
 * Lazily reads the property `key` of each value: the same as `map(iterable, v => v[key])`.
 * A value that is `null` or `undefined` throws a `TypeError`: the source is closed and the error propagates.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param key - the property to read: a `string`, a `symbol` or a `number`
 * @returns a lazy, re-runnable `Iterable` of the values of the property
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `key` is neither a function nor a property key
 * @example
 * ```ts
 * Array.from(Functions.map([{ name: 'Ann' }, { name: 'Bob' }], 'name')); // ['Ann', 'Bob']
 * ```
 * @since next
 */
export function map<T, P extends keyof T>(iterable: Iterable<T>, key: P): Iterable<T[P]>;
export function map<T, R>(iterable: Iterable<T>, mapper: Mapper<T, R> | PropertyKey): Iterable<R> {
	Validations.throwIfNotIterable(iterable, 'map');
	Validations.throwIfNotSelector(mapper, 'mapper', 'map');
	if (isPropertyKey(mapper))
		return new DeferredIterable(() => new MapKeyIterator<T, R>(iterable, mapper));
	return new DeferredIterable(() => new MapIterator(iterable, mapper));
}

class MapIterator<T, R> extends SourceIterator<T, R> {
	constructor(iterable: Iterable<T>, private readonly mapper: Mapper<T, R>) {
		super(iterable);
	}

	protected advance(): IteratorResult<R> {
		const n = this.source.next();
		if (n.done === true)
			return n;
		let value: R;
		try {
			value = this.mapper(n.value, this.index++);
		} catch (error) {
			this.closeAfterCallbackError();
			throw error;
		}
		return getContinueIteratorResult(value);
	}
}

class MapKeyIterator<T, R> extends SourceIterator<T, R> {
	constructor(iterable: Iterable<T>, private readonly key: PropertyKey) {
		super(iterable);
	}

	protected advance(): IteratorResult<R> {
		const n = this.source.next();
		if (n.done === true)
			return n;
		let value: R;
		try {
			value = (n.value as any)[this.key];
		} catch (error) {
			this.closeAfterCallbackError();
			throw error;
		}
		return getContinueIteratorResult(value);
	}
}
