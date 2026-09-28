import { SourceIterator, DeferredIterable } from '../iterators';
import { Predicate } from '../types';
import { Validations } from '../utils';

/**
 * Lazily keeps only the values that satisfy `predicate`.
 * If `predicate` throws, the source is closed and the error propagates.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param predicate - called with each value and its index; return `true` to keep the value
 * @returns a lazy, re-runnable `Iterable` of the kept values
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `predicate` is not a function
 * @example
 * ```ts
 * Array.from(Functions.filter([1, 2, 3, 4], v => v % 2 === 0)); // [2, 4]
 * ```
 * @since 0.0.10
 */
export function filter<T>(iterable: Iterable<T>, predicate: Predicate<T>): Iterable<T> {
	Validations.throwIfNotIterable(iterable);
	Validations.throwIfNotFunction(predicate, 'predicate');
	return new DeferredIterable(() => new FilterIterator(iterable, predicate));
}

class FilterIterator<T> extends SourceIterator<T, T> {
	constructor(iterable: Iterable<T>, private readonly predicate: Predicate<T>) {
		super(iterable);
	}

	protected advance(): IteratorResult<T> {
		for (let n = this.source.next(); ; n = this.source.next()) {
			if (n.done === true)
				return n;
			let keep: boolean;
			try {
				keep = this.predicate(n.value, this.index++);
			} catch (error) {
				this.closeAfterCallbackError();
				throw error;
			}
			if (keep)
				return n;
		}
	}
}
