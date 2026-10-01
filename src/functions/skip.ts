import { SourceIterator, DeferredIterable } from '../iterators';
import { Validations } from '../utils';

/**
 * Lazily skips the first `count` values and yields the rest.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param count - how many values to skip; must be a non-negative integer
 * @returns a lazy, re-runnable `Iterable` of the remaining values
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `count` is negative, not an integer, `NaN` or `Infinity`
 * @example
 * ```ts
 * Array.from(Functions.skip([1, 2, 3, 4, 5], 2)); // [3, 4, 5]
 * ```
 * @since next
 */
export function skip<T>(iterable: Iterable<T>, count: number): Iterable<T> {
	Validations.throwIfNotIterable(iterable);
	Validations.throwIfNotNonNegativeInteger(count, 'count');
	return new DeferredIterable(() => new SkipIterator(iterable, count));
}

class SkipIterator<T> extends SourceIterator<T, T> {
	constructor(iterable: Iterable<T>, private readonly count: number) {
		super(iterable);
	}

	protected advance(): IteratorResult<T> {
		while (this.index < this.count) {
			const n = this.source.next();
			if (n.done === true)
				return n;
			this.index++;
		}
		return this.source.next();
	}
}
