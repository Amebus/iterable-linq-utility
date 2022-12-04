import * as LinkedList from "@/genericCollections";

export function materialize<T>(iterable: Iterable<T>): Iterable<T> {
	if (iterable instanceof MaterializeIterable) {
    return iterable;
  }
	return new MaterializeIterable(iterable);
}

class MaterializeIterable<T> implements Iterable<T> {

	constructor(iterable: Iterable<T>) {
		if (iterable instanceof LinkedList.LinkedList) {
			this.source = iterable;
			return;
		}
		this.source = LinkedList.from(iterable);
	}

	private source: Iterable<T>;

	[Symbol.iterator](): Iterator<T, any, undefined> {
		return new MaterializeIterableIterator(this.source);
	}
}

class MaterializeIterableIterator<T> implements Iterator<T> {
	
	constructor(source: Iterable<T>) {
    this.sourceIterator =  source[Symbol.iterator]();
  }

	private sourceIterator: Iterator<T>;

	next(): IteratorResult<T, any> {
		return this.sourceIterator.next();
	}

}