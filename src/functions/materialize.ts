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

	private source: Iterable<T>;

	constructor(iterable: Iterable<T>) {
		this.source = LinkedListCollection.from(iterable);
	}

	[Symbol.iterator](): Iterator<T, any, undefined> {
		return new MaterializeIterableIterator(this.source);
	}
}

class MaterializeIterableIterator<T> implements Iterator<T> {

	private sourceIterator: Iterator<T>;

	constructor(source: Iterable<T>) {
		this.sourceIterator =  source[Symbol.iterator]();
	}

	next(): IteratorResult<T, any> {
		return this.sourceIterator.next();
	}
}
