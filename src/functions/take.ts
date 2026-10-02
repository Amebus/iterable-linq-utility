import { SourceIterator, DeferredIterable } from '../iterators';
import { getContinueIteratorResult, getDoneIteratorResult, Validations } from '../utils';

/**
 * Lazily yields the first `count` values, then closes the source.
 * The source is never read past the `count`-th value, so `take` also ends an infinite source.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param count - how many values to yield; must be a non-negative integer
 * @returns a lazy, re-runnable `Iterable` of at most `count` values
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `count` is negative, not an integer, `NaN` or `Infinity`
 * @example
 * ```ts
 * Array.from(Functions.take([1, 2, 3, 4, 5], 3)); // [1, 2, 3]
 * ```
 * @since 0.3.0
 */
export function take<T>(iterable: Iterable<T>, count: number): Iterable<T> {
	Validations.throwIfNotIterable(iterable);
	Validations.throwIfNotNonNegativeInteger(count, 'count');
	return new DeferredIterable(() => new TakeIterator(iterable, count));
}

class TakeIterator<T> extends SourceIterator<T, T> {
	constructor(iterable: Iterable<T>, private readonly count: number) {
		super(iterable);
	}

	protected advance(): IteratorResult<T> {
		if (this.index >= this.count) {
			this.source.return?.();
			return getDoneIteratorResult();
		}
		const n = this.source.next();
		if (n.done === true)
			return n;
		this.index++;
		return getContinueIteratorResult(n.value);
	}
}
