import { SourceIterator, DeferredIterable } from '../iterators';
import { Mapper } from '../types';
import { getContinueIteratorResult, Validations } from '../utils';

/**
 * Lazily transforms each value with `mapper`.
 * @operation `Transformation`
 * @param iterable the source `Iterable`
 * @param mapper called with each value and its index
 * @returns a lazy, re-runnable `Iterable` of the mapped values
 */
export function map<T, R>(iterable: Iterable<T>, mapper: Mapper<T, R>): Iterable<R> {
	Validations.throwIfNotIterable(iterable);
	Validations.throwIfNotFunction(mapper, 'mapper');
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
		return getContinueIteratorResult(this.mapper(n.value, this.index++));
	}
}
