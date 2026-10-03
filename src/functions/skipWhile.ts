import { SourceIterator, DeferredIterable } from '../iterators';
import { Predicate } from '../types';
import { Validations } from '../utils';

/**
 * Lazily skips the values while `predicate` returns `true`, then yields the first rejected value and all the rest.
 * After the first rejected value, `predicate` is not called again.
 * If `predicate` throws, the source is closed and the error propagates.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param predicate - called with each value and its index until it returns `false`
 * @returns a lazy, re-runnable `Iterable` of the values from the first rejected one
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `predicate` is not a function
 * @example
 * ```ts
 * Array.from(Functions.skipWhile([1, 2, 5, 3], v => v < 4)); // [5, 3]
 * ```
 * @since 0.5.0
 */
export function skipWhile<T>(iterable: Iterable<T>, predicate: Predicate<T>): Iterable<T> {
	Validations.throwIfNotIterable(iterable);
	Validations.throwIfNotFunction(predicate, 'predicate');
	return new DeferredIterable(() => new SkipWhileIterator(iterable, predicate));
}

class SkipWhileIterator<T> extends SourceIterator<T, T> {
	private skipping = true;

	constructor(iterable: Iterable<T>, private readonly predicate: Predicate<T>) {
		super(iterable);
	}

	protected advance(): IteratorResult<T> {
		if (!this.skipping)
			return this.source.next();
		for (let n = this.source.next(); ; n = this.source.next()) {
			if (n.done === true)
				return n;
			let skip: boolean;
			try {
				skip = this.predicate(n.value, this.index++);
			} catch (error) {
				this.closeAfterCallbackError();
				throw error;
			}
			if (!skip) {
				this.skipping = false;
				return n;
			}
		}
	}
}
