import { Validations } from '../utils';
import { LinkedListCollection } from '../collections';

/**
 * Reads `iterable` immediately and stores its values.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @returns an `Iterable` over the stored values; a materialized input is returned as is
 */
export function materialize<T>(iterable: Iterable<T>): Iterable<T> {
	Validations.throwIfNotIterable(iterable);
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
