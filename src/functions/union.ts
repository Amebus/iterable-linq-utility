import { BaseIterator, DeferredIterable } from '../iterators';
import type { Mapper } from '../types';
import { Validations } from '../utils';

/**
 * Lazily yields the distinct values of `iterable`, then the values of `other` not yielded yet.
 * `other` is opened only when `iterable` ends, so after an infinite source it is never read; stopping early closes only the source being read.
 * Values, or the keys returned by `keySelector`, are compared with `SameValueZero`, like `Set`: for each key the first value is yielded.
 * If `keySelector` throws, the source being read is closed and the error propagates.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param other - the `Iterable` read after the source
 * @param keySelector - called with every value and its index in its own source (from 0 again for `other`); omitted or `undefined` compares the values
 * @returns a lazy, re-runnable `Iterable` of the distinct values of `iterable` and `other`
 * @throws Error if `iterable` or `other` is missing or does not implement `[Symbol.iterator]`, or if a provided `keySelector` is not a function
 * @example
 * ```ts
 * Array.from(Functions.union([1, 2, 2], [2, 3])); // [1, 2, 3]
 * Array.from(Functions.union([{ id: 1 }], [{ id: 1 }, { id: 2 }], v => v.id)); // [{ id: 1 }, { id: 2 }]
 * ```
 * @since 0.12.0
 */
export function union<T, K>(iterable: Iterable<T>, other: Iterable<T>, keySelector?: Mapper<T, K>): Iterable<T> {
	Validations.throwIfNotIterable(iterable, 'union');
	Validations.throwIfNotIterable(other, 'union');
	if (keySelector !== undefined)
		Validations.throwIfNotFunction(keySelector, 'keySelector', 'union');
	return new DeferredIterable(() => new UnionIterator(iterable, other, keySelector));
}

/**
 * Reads the source, then `other`, with one `Set` of the keys yielded: only the source being read is open.
 */
class UnionIterator<T, K> extends BaseIterator<T> {
	private readonly seen = new Set<unknown>();
	private current?: Iterator<T>;
	private readingOther = false;
	private index = 0;

	constructor(iterable: Iterable<T>, private readonly other: Iterable<T>, private readonly keySelector?: Mapper<T, K>) {
		super();
		this.current = iterable[Symbol.iterator]();
	}

	protected advance(): IteratorResult<T> {
		for (;;) {
			const n = this.current!.next();
			if (n.done === true) {
				if (this.readingOther)
					return n;
				this.readingOther = true;
				this.index = 0;
				// cleared first: if opening `other` throws, return() has nothing to close
				this.current = undefined;
				this.current = this.other[Symbol.iterator]();
				continue;
			}
			const key = this.keyOf(n.value);
			if (!this.seen.has(key)) {
				this.seen.add(key);
				return n;
			}
		}
	}

	protected override onReturn(value?: any): void {
		this.current?.return?.(value);
	}

	private keyOf(value: T): unknown {
		if (this.keySelector === undefined)
			return value;
		try {
			return this.keySelector(value, this.index++);
		} catch (error) {
			this.closeAfterCallbackError();
			throw error;
		}
	}
}
