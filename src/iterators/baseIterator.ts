import { getDoneIteratorResult } from '../utils';

/**
 * Base class of every iterator in the library.
 * It owns the "done" state: once `advance()` returns a done result, or `return()` is called,
 * every later `next()` returns a done result.
 */
export abstract class BaseIterator<T> implements IterableIterator<T> {
	private done = false;

	next(): IteratorResult<T> {
		if (this.done)
			return getDoneIteratorResult();
		const result = this.advance();
		if (result.done === true)
			this.done = true;
		return result;
	}

	return(value?: any): IteratorResult<T> {
		if (!this.done) {
			this.done = true;
			this.onReturn();
		}
		return getDoneIteratorResult(value);
	}

	[Symbol.iterator](): IterableIterator<T> {
		return this;
	}

	/**
	 * Produces the next result. Called only while the iterator is not done.
	 */
	protected abstract advance(): IteratorResult<T>;

	/**
	 * Releases the resources held by the iterator. Called at most once, when the consumer stops early.
	 */
	protected onReturn(): void {
		// nothing to release by default
	}
}
