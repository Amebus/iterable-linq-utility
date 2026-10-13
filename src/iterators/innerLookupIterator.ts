import type { Mapper } from '../types';
import { isPropertyKey } from '../utils/selector';
import { SourceIterator } from './sourceIterator';

/**
 * Base class of `groupJoin` and `innerJoin`: before the first value, it reads the whole `inner` into a `Map`
 * from each key to its values, in the order of `inner` (`SameValueZero`, ADR 0024), then reads the source lazily.
 * `outerKey` and `innerKey` are called with the index of the value in its own source.
 * A key that is a property key is read inline, from its own field, so the call of a function key does not change (ADR 0025).
 */
export abstract class InnerLookupIterator<T, I, K, R> extends SourceIterator<T, R> {
	private groups: Map<unknown, I[]> | undefined;
	private readonly outerKey?: Mapper<T, K>;
	private readonly outerProperty?: PropertyKey;
	private readonly innerKey?: Mapper<I, K>;
	private readonly innerProperty?: PropertyKey;

	constructor(
		iterable: Iterable<T>,
		private readonly inner: Iterable<I>,
		outerKey: Mapper<T, K> | PropertyKey,
		innerKey: Mapper<I, K> | PropertyKey
	) {
		super(iterable);
		if (isPropertyKey(outerKey))
			this.outerProperty = outerKey;
		else
			this.outerKey = outerKey;
		if (isPropertyKey(innerKey))
			this.innerProperty = innerKey;
		else
			this.innerKey = innerKey;
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
			return this.outerKey !== undefined ? this.outerKey(value, this.index++) : (value as any)[this.outerProperty!];
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
				const key = this.innerKey !== undefined ? this.innerKey(value, index++) : (value as any)[this.innerProperty!];
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
