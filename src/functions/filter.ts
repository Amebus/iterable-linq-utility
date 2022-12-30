import { getDoneIteratorResult, getFlatIteratorResult, isFunction } from "../utils";
import { Predicate } from "../types";

/**
 * 
 * @operation `Transformation`
 * @param iterable 
 * @param predicate 
 * @returns 
 */
export function filter<T>(iterable: Iterable<T>, predicate: Predicate<T>): Iterable<T> {
	if (iterable == null)
		throw 'The source "iterable" must be provided';
	if (!isFunction(predicate))
		throw '"predicate" function must be provided';
  return new FilterIterable(iterable, predicate);
}

class FilterIterable<T> implements Iterable<T> {
	constructor(iterable: Iterable<T>, predicate: Predicate<T>) {
		this.source = iterable;
		this.predicate = predicate;
	}
	[Symbol.iterator](): Iterator<T, any, undefined> {
		return new FilterIterableIterator(this.source, this.predicate);
	}

	private predicate: Predicate<T>;
	private source: Iterable<T>;
}

class FilterIterableIterator<T> implements Iterator<T> {

	constructor(source: Iterable<T>, predicate: Predicate<T>) {
		this.sourceIterator = source[Symbol.iterator]();
		this.predicate = predicate;
	}

	private index = 0;
	private sourceIterator: Iterator<T>;
	private predicate: Predicate<T>;

	private internalNext: () => IteratorResult<T, any> = () => {
		// eslint-disable-next-line no-constant-condition
		while (true) {
			const n = this.sourceIterator.next();
			if (n.done === true || this.predicate(n.value, this.index++))
				return getFlatIteratorResult(n);
		}
	};

	next(): IteratorResult<T, any> {
		return this.internalNext();
	}
	return?(value?: any): IteratorResult<T, any> {
		this.internalNext = getDoneIteratorResult;
		return getDoneIteratorResult(value);
	}
}