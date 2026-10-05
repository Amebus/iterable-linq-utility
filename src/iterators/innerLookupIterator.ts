import type { Mapper } from '../types';
import { SourceIterator } from './sourceIterator';

/**
 * Base class of `groupJoin` and `innerJoin`: before the first value, it reads the whole `inner` into a `Map`
 * from each key to its values, in the order of `inner` (`SameValueZero`, ADR 0024), then reads the source lazily.
 * `outerKey` and `innerKey` are called with the index of the value in its own source.
 */
export abstract class InnerLookupIterator<T, I, K, R> extends SourceIterator<T, R> {
	private groups: Map<unknown, I[]> | undefined;

	constructor(
		iterable: Iterable<T>,
		private readonly inner: Iterable<I>,
		private readonly outerKey: Mapper<T, K>,
		private readonly innerKey: Mapper<I, K>
	) {
		super(iterable);
	}

	/**
	 * The values of `inner` with the same key as `value`, or `undefined` when there are none.
	 */
	protected matches(value: T): I[] | undefined {
		const groups = this.groups ??= this.readInner();
		return groups.get(this.keyOf(value));
	}

	private keyOf(value: T): unknown {
		try {
			return this.outerKey(value, this.index++);
		} catch (error) {
			this.closeAfterCallbackError();
			throw error;
		}
	}

	private readInner(): Map<unknown, I[]> {
		const groups = new Map<unknown, I[]>();
		let index = 0;
		// also around the reading of `inner`: if it throws, the source is closed too, as in OtherKeysIterator;
		// for…of closes `inner` when the innerKey throws
		try {
			for (const value of this.inner) {
				const key = this.innerKey(value, index++);
				const group = groups.get(key);
				if (group === undefined)
					groups.set(key, [value]);
				else
					group.push(value);
			}
		} catch (error) {
			this.closeAfterCallbackError();
			throw error;
		}
		return groups;
	}
}
