import { getDoneIteratorResult, getContinueIteratorResult, Validations } from '../utils';

export function repeat<T>(value: T, count: number): Iterable<T> {
	Validations.throwIfNegative(count, 'count');
	return new RepeatIterable(value, count);
}

class RepeatIterable<T> implements Iterable<T> {

	private readonly value: T;
	private readonly count: number;

	constructor(value: T, count: number) {
		this.value = value;
		this.count = count;
	}

	[Symbol.iterator](): Iterator<T, any, undefined> {
		return new RepeatIterableIterator(this.value, this.count);
	}
}

class RepeatIterableIterator<T> implements Iterator<T> {

	leftToRepeat: number = 0;
	private readonly value: T;
	private readonly count: number;

	constructor(value: T, count: number) {
		this.value = value;
		this.count = count;
		this.leftToRepeat = count;
		if (count === 0)
			this.internalNext = getDoneIteratorResult;
	}

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
