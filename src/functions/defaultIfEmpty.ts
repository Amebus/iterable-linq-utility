import { SourceIterator, DeferredIterable } from '../iterators';
import { getContinueIteratorResult, getDoneIteratorResult, Validations } from '../utils';

/**
 * Lazily yields the values of `iterable`, or only `value` when `iterable` is empty.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param value - the value yielded when `iterable` has no values
 * @returns a lazy, re-runnable `Iterable` of the values, or of `value` alone
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`
 * @example
 * ```ts
 * Array.from(Functions.defaultIfEmpty([1, 2], 0)); // [1, 2]
 * Array.from(Functions.defaultIfEmpty([], 0)); // [0]
 * ```
 * @since 0.10.0
 */
export function defaultIfEmpty<T>(iterable: Iterable<T>, value: T): Iterable<T> {
	Validations.throwIfNotIterable(iterable, 'defaultIfEmpty');
	return new DeferredIterable(() => new DefaultIfEmptyIterator(iterable, value));
}

class DefaultIfEmptyIterator<T> extends SourceIterator<T, T> {
	private empty = true;
	private sourceDone = false;

	constructor(iterable: Iterable<T>, private readonly value: T) {
		super(iterable);
	}

	protected advance(): IteratorResult<T> {
		if (this.sourceDone)
			return getDoneIteratorResult();
		const n = this.source.next();
		if (n.done !== true) {
			this.empty = false;
			return n;
		}
		this.sourceDone = true;
		return this.empty ? getContinueIteratorResult(this.value) : n;
	}
}
