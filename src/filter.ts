import { combinePredicates } from "./utils";
import { getFlatIteratorResult } from "./iteratorResults";

export function filter<T>(iterable: Iterable<T>, predicate: (value: T, index: number) => boolean): Iterable<T> {
  return new FilterIterable(iterable, predicate);
}

class FilterIterable<T> implements Iterable<T> {
	constructor(iterable: Iterable<T>, predicate: (value: T, index: number) => boolean) {
		let newPredicate = predicate;
		let source = iterable;
		if (source instanceof FilterIterable) { // TODO check if it's a real performance improvement
			const oldPredicate = source.predicate;
			source = source.source;
			newPredicate = combinePredicates(oldPredicate, newPredicate);
		}
		this.source = source;
		this.predicate = newPredicate;
	}
	[Symbol.iterator](): Iterator<T, any, undefined> {
		return new FilterIterableIterator(this.source, this.predicate);
	}

	private predicate: (value: T, index: number) => boolean;
	private source: Iterable<T>;
}

class FilterIterableIterator<T> implements Iterator<T> {

	constructor(source: Iterable<T>, predicate: (value: T, index: number) => boolean) {
		this.sourceIterator = source[Symbol.iterator]();
		this.predicate = predicate;
	}

	private index = 0;
	private sourceIterator: Iterator<T>;
	private predicate: (value: T, index: number) => boolean;

	next(): IteratorResult<T, any> {
		// eslint-disable-next-line no-constant-condition
		while (true) {
			const n = this.sourceIterator.next();
			if (n.done === true || this.predicate(n.value, this.index++))
				return getFlatIteratorResult(n);
		}
	}
}