import { SourceIterator, DeferredIterable } from '../iterators';
import { getContinueIteratorResult, Validations } from '../utils';

/**
 * Lazily yields `value`, then the values of `iterable`.
 * `value` is yielded before the source is read.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param value - the value yielded before the first value of the source
 * @returns a lazy, re-runnable `Iterable` of `value` followed by the values of the source
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`
 * @example
 * ```ts
 * Array.from(Functions.prepend([1, 2, 3], 0)); // [0, 1, 2, 3]
 * ```
 * @since next
 */
export function prepend<T>(iterable: Iterable<T>, value: T): Iterable<T> {
	Validations.throwIfNotIterable(iterable, 'prepend');
	return new DeferredIterable(() => new PrependIterator(iterable, value));
}

class PrependIterator<T> extends SourceIterator<T, T> {
	private valueYielded = false;

	constructor(iterable: Iterable<T>, private readonly value: T) {
		super(iterable);
	}

	protected advance(): IteratorResult<T> {
		if (this.valueYielded)
			return this.source.next();
		this.valueYielded = true;
		return getContinueIteratorResult(this.value);
	}
}
