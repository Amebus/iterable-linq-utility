import { LinkedListCollection } from '../collections';
import { DeferredIterable, SourceIterator } from '../iterators';
import { Validations } from '../utils';

/**
 * Lazily yields the values in reverse order. Unlike `Array.prototype.reverse`, the source is not changed.
 * The whole source is read before the first value is yielded, so `reverse` does not end on an infinite source.
 * Every iteration reads the source again.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @returns a lazy, re-runnable `Iterable` of the values from the last to the first
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`
 * @example
 * ```ts
 * Array.from(Functions.reverse([1, 2, 3])); // [3, 2, 1]
 * ```
 * @since 0.9.0
 */
export function reverse<T>(iterable: Iterable<T>): Iterable<T> {
	Validations.throwIfNotIterable(iterable, 'reverse');
	return new DeferredIterable(() => new ReverseIterator(iterable));
}

class ReverseIterator<T> extends SourceIterator<T, T> {
	/** The values from the last to the first, read on the first `next()`. */
	private reversed?: Iterator<T>;

	protected advance(): IteratorResult<T> {
		this.reversed ??= this.fill();
		return this.reversed.next();
	}

	protected override onReturn(value?: any): void {
		this.reversed = undefined;
		super.onReturn(value);
	}

	/**
	 * Reads the whole source, adding each value at the head of a list: the list starts with the last value.
	 */
	private fill(): Iterator<T> {
		const list = new LinkedListCollection.LinkedList<T>();
		for (let n = this.source.next(); n.done !== true; n = this.source.next())
			list.addFirst(n.value);
		return list[Symbol.iterator]();
	}
}
