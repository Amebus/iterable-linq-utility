import { getDoneIteratorResult, isFunction } from "../utils";


export interface IOsCIterable<T> extends Iterable<T> {
	[Symbol.iterator]<TR, TN>(): Iterator<T, TR, TN>;
}

// export abstract class OsCIterator<T, TR, TN> implements Iterator<T, TR, TN> {
	
// 	constructor(sourceIterable: Iterable<T>) {
// 		this.sourceIterator = sourceIterable[Symbol.iterator]() as Iterator<T, TR, TN>;
// 		this.passThroughNext = this.sourceIterator.next.bind(this.sourceIterator);
// 		this.internalNext = this.passThroughNext;
// 	}

// 	protected readonly sourceIterator: Iterator<T, TR, TN>;
// 	protected passThroughNext: (...args: [] | [TN]) => IteratorResult<T, TR>;
// 	protected internalNext: (...args: [] | [TN]) => IteratorResult<T, TR>;

// 	next(...args: [] | [TN]): IteratorResult<T, TR> {
// 		return this.internalNext(...args);
// 	}
// 	return(value?: TR): IteratorResult<T, TR> {
// 		this.internalNext = this.passThroughNext;
// 		const sourceIterator = this.sourceIterator;
// 		if (isFunction(sourceIterator.return))
// 			return sourceIterator.return(value);
// 		return getDoneIteratorResult(value);
// 	}
// 	throw(e?: any): IteratorResult<T, TR> {
// 		this.internalNext = this.passThroughNext;
// 		const sourceIterator = this.sourceIterator;
// 		if (isFunction(sourceIterator.throw))
// 			return sourceIterator.throw(e);
// 		return getDoneIteratorResult();
// 	}

// }