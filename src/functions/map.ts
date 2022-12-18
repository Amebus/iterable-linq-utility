import { Mapper } from "@/types";
import { getDoneIteratorResult, getIteratorResult } from "@/utils";

/**
 * 
 * @operation `Transformation`
 * @param iterable 
 * @param mapper 
 * @returns 
 */
export function map<T, R>(iterable: Iterable<T>, mapper: Mapper<T, R>): Iterable<R> {
  return new MapIterable(iterable, mapper);
}

class MapIterable<T,R> implements Iterable<R> {

	constructor(iterable: Iterable<T>, mapper: Mapper<T,R>) {
		this.source = iterable;
		this.mapper = mapper;
	}

	[Symbol.iterator](): Iterator<R, any, undefined> {
		return new MapIterableIterator(this.source, this.mapper);
	}

	private mapper: Mapper<T, R>;
	private source: Iterable<T>;
}

class MapIterableIterator<T, R> implements Iterator<R> {
	
	constructor(source: Iterable<T>, mapper: Mapper<T, R>) {
		this.sourceIterator = source[Symbol.iterator]();
		this.mapper = mapper;
	}

	private index = 0;
	private sourceIterator: Iterator<T>;
	private mapper: Mapper<T, R>;


	next(): IteratorResult<R, any> {
		const n = this.sourceIterator.next();
		if (n.done !== true) return getIteratorResult<R>(false, this.mapper(n.value, this.index++));
		return getDoneIteratorResult<R>();
	}
}