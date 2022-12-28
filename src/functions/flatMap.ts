import { Mapper } from '@/types';
import { getContinueIteratorResult, getDoneIteratorResult } from '@/utils';

/**
 * @operation `Transformation`
 * @param iterable 
 * @param mapper 
 * @returns 
 */
export function flatMap<T, R>(iterable: Iterable<T>, mapper: Mapper<T, Iterable<R>>): Iterable<R> {
	return new FlatMapIterable(iterable, mapper);
}


class FlatMapIterable<T, R> implements Iterable<R> {
	
	constructor(iterable: Iterable<T>, mapper: Mapper<T,Iterable<R>>) {
		this.source = iterable;
		this.mapper = mapper;
	}

	[Symbol.iterator](): Iterator<R, any, undefined> {
		return new FlatMapIterableIterator(this.source, this.mapper);
	}

	private readonly mapper: Mapper<T, Iterable<R>>;
	private readonly source: Iterable<T>;

}

class FlatMapIterableIterator<T,R> implements Iterator<R> {

	constructor(source: Iterable<T>, mapper: Mapper<T,Iterable<R>>) {
		this.sourceIterator = source[Symbol.iterator]();
		this.mapper = mapper;
	}

	private index: number = 0;
	private readonly mapper: Mapper<T, Iterable<R>>;
	private readonly sourceIterator: Iterator<T>;

	private fmIterator: Iterator<R>;

	private sourceNext: () => IteratorResult<R, any> =() => {
		const n = this.sourceIterator.next();
		if (n.done !== true) {
			const fmIterable = this.mapper(n.value, this.index++);
			this.fmIterator = fmIterable[Symbol.iterator]();
			this.internalNext = this.fmNext;
			return this.internalNext();
		}
		this.internalNext = getDoneIteratorResult;
		return this.internalNext();
	};

	private fmNext: () => IteratorResult<R, any> =() => {
		const n = this.fmIterator.next();
		if (n.done !== true) {
			return getContinueIteratorResult( n.value );
		}
		this.internalNext = this.sourceNext;
		return this.internalNext();
	};

	internalNext: () => IteratorResult<R, any> = this.sourceNext;

	next(): IteratorResult<R, any> {
		return this.internalNext();
	}
	return?(value?: any): IteratorResult<R, any> {
		this.internalNext = getDoneIteratorResult;
		return getDoneIteratorResult(value);
	}
}