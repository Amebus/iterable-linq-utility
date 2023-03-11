import { getDoneIteratorResult } from "../utils";

export function empty<T>(): Iterable<T> {
	return new EmptyIterable();
}

class EmptyIterable<T> implements Iterable<T> {
	[Symbol.iterator](): Iterator<T, any, undefined> {
		return new EmptyIterableIterator();	
	}
}

class EmptyIterableIterator<T> implements Iterator<T> {
	next(): IteratorResult<T, any> {
		return getDoneIteratorResult();
	}
	return?(value?: any): IteratorResult<T, any> {
		return getDoneIteratorResult(value);
	}
	throw?(): IteratorResult<T> {
		return getDoneIteratorResult();
	}
}