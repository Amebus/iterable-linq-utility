import { getDoneIteratorResult } from '../utils';

/**
 * Base class of every iterator in the library.
 * It owns the "done" state: once `advance()` returns a done result, `return()` is called, or a callback throws
 * (see `closeAfterCallbackError`), every later `next()` returns a done result.
 * Like the ECMAScript Iterator Helpers, library iterators expose `next` and `return` only (no `throw`).
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
			this.onReturn(value);
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
	 * @param _value - the value passed to `return()`
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected onReturn(_value?: any): void {
		// nothing to release by default
	}

	/**
	 * Ends the iterator after a user callback threw, and releases its resources as `return()` does.
	 * Subclasses call it from a `catch` around the callback only: an error thrown by the source must not close the source.
	 * The try/catch lives in `advance()`, not in `next()`: in `next()` it slows every chain down.
	 */
	protected closeAfterCallbackError(): void {
		if (this.done)
			return;
		this.done = true;
		try {
			this.onReturn();
		} catch {
			// the callback error wins, as in the ECMAScript Iterator Helpers
		}
	}
}
