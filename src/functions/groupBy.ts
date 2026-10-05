import { DeferredIterable, SourceIterator } from '../iterators';
import type { Mapper } from '../types';
import { Validations } from '../utils';

/**
 * Lazily yields one `[key, values]` pair for each key returned by `keySelector`, in the order of the first appearance of the key;
 * the values of a group are in the order of the source.
 * The whole source is read before the first group is yielded, so `groupBy` does not end on an infinite source.
 * Every iteration reads the source again and builds new arrays.
 * The keys are compared with `SameValueZero`, like `Map`: `NaN` is one key, `null` and `undefined` are keys too.
 * If `keySelector` throws, the source is closed and the error propagates.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param keySelector - called with each value and its index; returns the key of the group of the value
 * @returns a lazy, re-runnable `Iterable` of `[key, values]` pairs
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `keySelector` is not a function
 * @example
 * ```ts
 * Array.from(Functions.groupBy([1, 2, 3, 4, 5], v => v % 2)); // [[1, [1, 3, 5]], [0, [2, 4]]]
 * ```
 * @since next
 */
export function groupBy<T, K>(iterable: Iterable<T>, keySelector: Mapper<T, K>): Iterable<[K, T[]]> {
	Validations.throwIfNotIterable(iterable, 'groupBy');
	Validations.throwIfNotFunction(keySelector, 'keySelector', 'groupBy');
	return new DeferredIterable(() => new GroupByIterator(iterable, keySelector));
}

class GroupByIterator<T, K> extends SourceIterator<T, [K, T[]]> {
	/** The groups, read on the first `next()`. */
	private groups?: Iterator<[K, T[]]>;

	constructor(iterable: Iterable<T>, private readonly keySelector: Mapper<T, K>) {
		super(iterable);
	}

	protected advance(): IteratorResult<[K, T[]]> {
		this.groups ??= this.fill();
		return this.groups.next();
	}

	protected override onReturn(value?: any): void {
		this.groups = undefined;
		super.onReturn(value);
	}

	/**
	 * Reads the whole source into a `Map` from each key to its values: a `Map` keeps the order of the first insertion of each key.
	 */
	private fill(): Iterator<[K, T[]]> {
		const groups = new Map<K, T[]>();
		for (let n = this.source.next(); n.done !== true; n = this.source.next()) {
			const key = this.keyOf(n.value);
			const group = groups.get(key);
			if (group === undefined)
				groups.set(key, [n.value]);
			else
				group.push(n.value);
		}
		return groups.entries();
	}

	private keyOf(value: T): K {
		try {
			return this.keySelector(value, this.index++);
		} catch (error) {
			this.closeAfterCallbackError();
			throw error;
		}
	}
}
