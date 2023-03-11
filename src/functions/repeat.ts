import { getDoneIteratorResult, getContinueIteratorResult } from "../utils";

export function repeat<T>(value: T, count: number): Iterable<T> {
	if (count < 0)
		throw '"count" parameter must be greater or equal then 0';
	return new RepeatIterable(value, count);
}

class RepeatIterable<T> implements Iterable<T> {

	constructor(value: T, count: number) {
		this.value = value;
		this.count = count;
	}

	[Symbol.iterator](): Iterator<T, any, undefined> {
		return new RepeatIterableIterator(this.value, this.count);
	}

	private readonly value: T;
	private readonly count: number;

}

class RepeatIterableIterator<T> implements Iterator<T> {
	
	constructor(value: T, count: number) {
		this.value = value;
		this.count = count;
		this.leftToRepeat = count;
		if (count === 0)
			this.internalNext = getDoneIteratorResult;
	}

	leftToRepeat: number = 0;
	private readonly value: T;
	private readonly count: number;

	internalNext: () => IteratorResult<T,any> = () => {
		if (this.leftToRepeat--)
			return getContinueIteratorResult(this.value);
		this.internalNext = getDoneIteratorResult;
		return getDoneIteratorResult();
	};

	next(): IteratorResult<T, any> {
		return this.internalNext();
	}
	return(value?: any): IteratorResult<T, any> {
		this.internalNext = getDoneIteratorResult;
		return getDoneIteratorResult(value);
	}
}