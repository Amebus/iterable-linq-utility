import { Validations } from '../utils';
import { LinkedListCollection } from '../collections';

/**
 *
 * @operation `Action`
 * @param iterable
 * @returns
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
