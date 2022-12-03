import { combineMappers } from "./utils";
import { getDoneIteratorResult, getIteratorResult } from "./iteratorResults";

export function map<T, R>(iterable: Iterable<T>, mapper: (value: T, index: number) => R): Iterable<R> {
  return new MapIterable(iterable, mapper);
}

class MapIterable<T,R> implements Iterable<R> {

	constructor(iterable: Iterable<T>, mapper: (value: T, index: number) => R) {
		let newMapper = mapper;
		let source = iterable;
		if (source instanceof MapIterable) { // TODO check if it's a real performance improvement
			const oldMapper = source.mapper;
			source = source.source;
			newMapper = combineMappers(oldMapper, newMapper);
		}
		this.source = iterable;
		this.mapper = newMapper;
	}

	[Symbol.iterator](): Iterator<R, any, undefined> {
		return new MapIterableIterator(this.source, this.mapper);
	}

	private mapper: (value: T, index: number) => R;
	private source: Iterable<T>;
}

class MapIterableIterator<T, R> implements Iterator<R> {
	
	constructor(source: Iterable<T>, mapper: (value: T, index: number) => R) {
		this.sourceIterator = source[Symbol.iterator]();
		this.mapper = mapper;
	}

	private index = 0;
	private sourceIterator: Iterator<T>;
	private mapper: (value: T, index: number) => R;


	next(): IteratorResult<R, any> {
		const n = this.sourceIterator.next();
		if (n.done !== true) return getIteratorResult<R>(false, this.mapper(n.value, this.index++));
		return getDoneIteratorResult<R>();
	}
}