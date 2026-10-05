import type { Mapper } from '../types';
import { SourceIterator } from './sourceIterator';

/**
 * Base class of `intersect` and `except`: before the first value, it reads the whole `other` into a `Set` of keys
 * (`SameValueZero`, ADR 0024), then yields the values of the source that `keep` accepts.
 * The keys of the source and of `other` come from the same `keySelector`, called with the index in their own source.
 */
export abstract class OtherKeysIterator<T, K> extends SourceIterator<T, T> {
	private keys: Set<unknown> | undefined;

	constructor(iterable: Iterable<T>, private readonly other: Iterable<T>, private readonly keySelector?: Mapper<T, K>) {
		super(iterable);
	}

	/**
	 * Tells whether the value with `key` is yielded, and updates `keys` so that each key is yielded once.
	 */
	protected abstract keep(keys: Set<unknown>, key: unknown): boolean;

	protected advance(): IteratorResult<T> {
		const keys = this.keys ??= this.readOther();
		for (let n = this.source.next(); ; n = this.source.next()) {
			if (n.done === true)
				return n;
			if (this.keep(keys, this.keyOf(n.value)))
				return n;
		}
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

	private readOther(): Set<unknown> {
		const keys = new Set<unknown>();
		let index = 0;
		// also around the reading of `other`: if it throws, the source is closed too, as in sequenceEqual;
		// for…of closes `other` when the keySelector throws
		try {
			for (const value of this.other)
				keys.add(this.keySelector === undefined ? value : this.keySelector(value, index++));
		} catch (error) {
			this.closeAfterCallbackError();
			throw error;
		}
		return keys;
	}
}
