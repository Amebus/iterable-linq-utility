import { Tapper } from "../types";
import { getDoneIteratorResult, getFlatIteratorResult, isFunction } from "../utils";

/**
 * 
 * @operation `Tap`
 * @param iterable 
 * @param tapper 
 * @returns 
 */
export function tap<T>(iterable: Iterable<T>, tapper: Tapper<T>): Iterable<T> {
	if (iterable == null)
		throw 'The source "iterable" must be provided';
	if(!isFunction(tapper))
		throw '"tapper" function must be provided';
	return new TapIterable(iterable, tapper);
}

class TapIterable<T> implements Iterable<T> {
	
	constructor(iterable: Iterable<T>, tapper: Tapper<T>) {
		this.source = iterable;
		this.tapper = tapper;
	}

	[Symbol.iterator](): Iterator<T, any, undefined> {
		return new TapIterableIterator(this.source, this.tapper);
	}

	private tapper: Tapper<T>;
	private source: Iterable<T>;

}

class TapIterableIterator<T> implements Iterator<T> {

	constructor(source: Iterable<T>, tapper: Tapper<T>) {
		this.sourceIterator = source[Symbol.iterator]();
		this.tapper = tapper;
	}

	private index = 0;
	private sourceIterator: Iterator<T>;
	private tapper: Tapper<T>;

	private internalNext: () => IteratorResult<T, any> = () => {
		const n = this.sourceIterator.next();
		if (n.done !== true) {
			this.tapper(n.value, this.index++);
			return getFlatIteratorResult(n);
		}
		this.internalNext = getDoneIteratorResult;
		return getDoneIteratorResult();
	};

	next(): IteratorResult<T, any> {
		return this.internalNext();
	}
	return?(value?: any): IteratorResult<T, any> {
		this.internalNext = getDoneIteratorResult;
		return getDoneIteratorResult(value);
	}
}