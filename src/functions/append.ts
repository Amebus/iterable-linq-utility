import { SourceIterator, DeferredIterable } from '../iterators';
import { getContinueIteratorResult, getDoneIteratorResult, Validations } from '../utils';

/**
 * Lazily yields the values of `iterable`, then `value`.
 * `value` is yielded only when the source ends, so it is never reached on an infinite source.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param value - the value yielded after the last value of the source
 * @returns a lazy, re-runnable `Iterable` of the values of the source followed by `value`
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`
 * @example
 * ```ts
 * Array.from(Functions.append([1, 2, 3], 4)); // [1, 2, 3, 4]
 * ```
 * @since 0.8.0
 */
export function append<T>(iterable: Iterable<T>, value: T): Iterable<T> {
	Validations.throwIfNotIterable(iterable, 'append');
	return new DeferredIterable(() => new AppendIterator(iterable, value));
}

class AppendIterator<T> extends SourceIterator<T, T> {
	private sourceDone = false;

	constructor(iterable: Iterable<T>, private readonly value: T) {
		super(iterable);
	}

	protected advance(): IteratorResult<T> {
		if (this.sourceDone)
			return getDoneIteratorResult();
		const n = this.source.next();
		if (n.done !== true)
			return n;
		this.sourceDone = true;
		return getContinueIteratorResult(this.value);
	}
}
