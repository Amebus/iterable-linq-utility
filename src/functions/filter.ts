import { SourceIterator, DeferredIterable } from '../iterators';
import { Predicate } from '../types';
import { Validations } from '../utils';

/**
 * Lazily keeps only the values that satisfy `predicate`.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param predicate - called with each value and its index; return `true` to keep the value
 * @returns a lazy, re-runnable `Iterable` of the kept values
 */
export function filter<T>(iterable: Iterable<T>, predicate: Predicate<T>): Iterable<T> {
	Validations.throwIfNotIterable(iterable);
	Validations.throwIfNotFunction(predicate, 'predicate');
	return new DeferredIterable(() => new FilterIterator(iterable, predicate));
}

class FilterIterator<T> extends SourceIterator<T, T> {
	constructor(iterable: Iterable<T>, private readonly predicate: Predicate<T>) {
		super(iterable);
	}

	protected advance(): IteratorResult<T> {
		for (let n = this.source.next(); ; n = this.source.next()) {
			if (n.done === true || this.predicate(n.value, this.index++))
				return n;
		}
	}
}
