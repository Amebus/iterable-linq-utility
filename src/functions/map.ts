import { SourceIterator, DeferredIterable } from '../iterators';
import { Mapper } from '../types';
import { getContinueIteratorResult, Validations } from '../utils';

/**
 * Lazily transforms each value with `mapper`.
 * If `mapper` throws, the source is closed and the error propagates.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param mapper - called with each value and its index; returns the new value
 * @returns a lazy, re-runnable `Iterable` of the mapped values
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `mapper` is not a function
 * @example
 * ```ts
 * Array.from(Functions.map([1, 2, 3], v => v * 10)); // [10, 20, 30]
 * ```
 * @since 0.0.10
 */
export function map<T, R>(iterable: Iterable<T>, mapper: Mapper<T, R>): Iterable<R> {
	Validations.throwIfNotIterable(iterable, 'map');
	Validations.throwIfNotFunction(mapper, 'mapper', 'map');
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
