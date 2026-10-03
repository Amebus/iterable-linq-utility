import { SourceIterator, DeferredIterable } from '../iterators';
import { Mapper } from '../types';
import { Validations } from '../utils';

/**
 * Lazily yields the first value for each distinct value or selected key, in source order.
 * Keys use `SameValueZero`, like `Set`; original values are preserved.
 * Each iterator stores its own seen keys. If `keySelector` throws, the source is closed and the error propagates.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param keySelector - called with every source value and its index; omitted or `undefined` compares values directly
 * @returns a lazy, re-runnable `Iterable` of the first values for each key
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if a provided `keySelector` is not a function
 * @example
 * ```ts
 * Array.from(Functions.distinct([3, 1, 3, 2, 1])); // [3, 1, 2]
 * Array.from(Functions.distinct([{ id: 1 }, { id: 1 }, { id: 2 }], v => v.id)); // [{ id: 1 }, { id: 2 }]
 * ```
 * @since 0.5.0
 */
export function distinct<T, K>(iterable: Iterable<T>, keySelector?: Mapper<T, K>): Iterable<T> {
	Validations.throwIfNotIterable(iterable);
	if (keySelector !== undefined)
		Validations.throwIfNotFunction(keySelector, 'keySelector');
	return new DeferredIterable(() => new DistinctIterator(iterable, keySelector));
}

class DistinctIterator<T, K> extends SourceIterator<T, T> {
	private readonly seen = new Set<T | K>();

	constructor(iterable: Iterable<T>, private readonly keySelector?: Mapper<T, K>) {
		super(iterable);
	}

	protected advance(): IteratorResult<T> {
		for (let n = this.source.next(); ; n = this.source.next()) {
			if (n.done === true)
				return n;
			let key: T | K = n.value;
			if (this.keySelector !== undefined) {
				try {
					key = this.keySelector(n.value, this.index++);
				} catch (error) {
					this.closeAfterCallbackError();
					throw error;
				}
			}
			if (!this.seen.has(key)) {
				this.seen.add(key);
				return n;
			}
		}
	}
}
