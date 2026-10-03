import { Validations } from '../utils';
import { LinkedListCollection } from '../collections';

/**
 * Reads `iterable` immediately and stores its values.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @returns an `Iterable` over the stored values; a materialized input is returned as is
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`
 * @example
 * ```ts
 * const stored = Functions.materialize(Functions.map([1, 2, 3], v => v * 10)); // runs now
 * Array.from(stored); // [10, 20, 30], read from the stored values
 * ```
 * @since 0.0.10
 */
export function materialize<T>(iterable: Iterable<T>): Iterable<T> {
	Validations.throwIfNotIterable(iterable, 'materialize');
	if (iterable instanceof MaterializeIterable) {
		return iterable;
	}
	return new MaterializeIterable(iterable);
}

class MaterializeIterable<T> implements Iterable<T> {
	private readonly source: LinkedListCollection.LinkedList<T>;

	constructor(iterable: Iterable<T>) {
		this.source = LinkedListCollection.from(iterable);
	}

	[Symbol.iterator](): Iterator<T> {
		return this.source[Symbol.iterator]();
	}
}
