import { SourceIterator, DeferredIterable } from '../iterators';
import { getContinueIteratorResult, getDoneIteratorResult, Validations } from '../utils';

/**
 * Lazily yields arrays of `size` values; the last array has the remaining values and can be shorter.
 * Each array is new, and is yielded once its values have been read, so `chunk` works with infinite sources.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param size - how many values in each array; must be a positive integer
 * @returns a lazy, re-runnable `Iterable` of arrays of at most `size` values
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `size` is not a positive integer (`0`, fractions, `NaN` and `Infinity` included)
 * @example
 * ```ts
 * Array.from(Functions.chunk([1, 2, 3, 4, 5], 2)); // [[1, 2], [3, 4], [5]]
 * ```
 * @since next
 */
export function chunk<T>(iterable: Iterable<T>, size: number): Iterable<T[]> {
	Validations.throwIfNotIterable(iterable, 'chunk');
	Validations.throwIfNotPositiveInteger(size, 'size', 'chunk');
	return new DeferredIterable(() => new ChunkIterator(iterable, size));
}

class ChunkIterator<T> extends SourceIterator<T, T[]> {
	constructor(iterable: Iterable<T>, private readonly size: number) {
		super(iterable);
	}

	protected advance(): IteratorResult<T[]> {
		const values: T[] = [];
		while (values.length < this.size) {
			const n = this.source.next();
			if (n.done === true)
				return values.length === 0 ? getDoneIteratorResult() : getContinueIteratorResult(values);
			values.push(n.value);
		}
		return getContinueIteratorResult(values);
	}
}
