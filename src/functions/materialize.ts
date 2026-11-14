import { BaseIterator } from '../iterators';
import { collectToArray } from './collectToArray';
import { getContinueIteratorResult, getDoneIteratorResult, type IStoredValues, storedValues, Validations } from '../utils';

/**
 * Reads `iterable` immediately and stores its values.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @returns an `Iterable` over the stored values; a materialized input is returned as is
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`
 * @example
 * ```ts
 * const stored = Functions.materialize(Functions.map([1, 2, 3], v => v * 10)); // runs now
 * Array.from(stored); // [10, 20, 30], read from the stored values
 * ```
 * @since 0.0.10
 */
export function materialize<T>(iterable: Iterable<T>): Iterable<T> {
	Validations.throwIfNotIterable(iterable, 'iterable', 'materialize');
	if (iterable instanceof MaterializeIterable) {
		return iterable;
	}
	return new MaterializeIterable(iterable);
}

class MaterializeIterable<T> implements Iterable<T>, IStoredValues<T> {
	private readonly values: readonly T[];

	constructor(iterable: Iterable<T>) {
		// Array.from on an array or a Set, a loop on the iterators of the library, where Array.from is about 2× slower (ADR 0038)
		this.values = collectToArray(iterable);
	}

	[Symbol.iterator](): Iterator<T> {
		return new StoredValuesIterator(this.values);
	}

	[storedValues](): readonly T[] {
		return this.values;
	}
}

/**
 * Reads the stored values by index: as fast as an iterator over a linked list, while the built-in iterator of the array is
 * slower (ADR 0038).
 */
class StoredValuesIterator<T> extends BaseIterator<T> {
	private index = 0;

	constructor(private readonly values: readonly T[]) {
		super();
	}

	protected advance(): IteratorResult<T> {
		if (this.index < this.values.length)
			return getContinueIteratorResult(this.values[this.index++]);
		return getDoneIteratorResult();
	}
}
