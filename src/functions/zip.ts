import { BaseIterator, DeferredIterable } from '../iterators';
import { getContinueIteratorResult, getDoneIteratorResult, Validations } from '../utils';

/**
 * Lazily yields tuples of the values at the same position in `iterable` and in each of `others`.
 * It stops at the end of the shortest iterable and closes the others; if an iterable throws, the others are closed and the error propagates.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param others - the iterables read side by side with the source
 * @returns a lazy, re-runnable `Iterable` of tuples, as many as the values of the shortest iterable
 * @throws Error if `iterable` or a value of `others` is missing or does not implement `[Symbol.iterator]`
 * @example
 * ```ts
 * Array.from(Functions.zip([1, 2, 3], ['a', 'b'])); // [[1, 'a'], [2, 'b']]
 * Array.from(Functions.zip([1, 2], ['a', 'b'], [true, false])); // [[1, 'a', true], [2, 'b', false]]
 * ```
 * @since 0.10.0
 */
export function zip<T, U extends unknown[]>(iterable: Iterable<T>, ...others: { [K in keyof U]: Iterable<U[K]> }): Iterable<[T, ...U]> {
	Validations.throwIfNotIterable(iterable, 'zip');
	for (const other of others)
		Validations.throwIfNotIterable(other, 'zip');
	// copies the references of the rest parameter: the iterables are opened when the iteration starts
	const sources: Iterable<unknown>[] = [iterable, ...others];
	return new DeferredIterable(() => new ZipIterator(sources)) as Iterable<[T, ...U]>;
}

class ZipIterator extends BaseIterator<unknown[]> {
	/** The open iterators, one per source. */
	private readonly iterators: Iterator<unknown>[] = [];

	constructor(sources: readonly Iterable<unknown>[]) {
		super();
		try {
			for (const source of sources)
				this.iterators.push(source[Symbol.iterator]());
		} catch (error) {
			// the iterators already opened are closed
			this.closeAfterCallbackError();
			throw error;
		}
	}

	protected advance(): IteratorResult<unknown[]> {
		const iterators = this.iterators;
		const values = new Array<unknown>(iterators.length);
		for (let i = 0; i < iterators.length; i++) {
			let n: IteratorResult<unknown>;
			try {
				n = iterators[i].next();
			} catch (error) {
				// the iterator that threw is not closed: it already failed
				iterators.splice(i, 1);
				this.closeAfterCallbackError();
				throw error;
			}
			if (n.done === true) {
				// the iterator that ended is not closed: it is already done
				iterators.splice(i, 1);
				this.return();
				return getDoneIteratorResult();
			}
			values[i] = n.value;
		}
		return getContinueIteratorResult(values);
	}

	/**
	 * Closes the iterators from the last one: an iterator that throws on `return()` does not leave the others open.
	 */
	protected override onReturn(value?: any): void {
		const iterator = this.iterators.pop();
		if (iterator === undefined)
			return;
		try {
			iterator.return?.(value);
		} finally {
			this.onReturn(value);
		}
	}
}
