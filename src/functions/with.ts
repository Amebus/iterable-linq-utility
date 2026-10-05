import { SourceIterator, DeferredIterable } from '../iterators';
import { getContinueIteratorResult, getDoneIteratorResult, libraryError, Validations } from '../utils';

/**
 * Lazily yields the values of `iterable`, with `value` in place of the value at `index`, like `Array.prototype.with`; a negative index counts from the end.
 * A non-negative index yields the values as they are read. A negative index yields each value once `-index` more values have been read,
 * keeping only those `-index` values.
 * Exported as `with`, a reserved word that cannot name a function declaration.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param index - an integer; `-1` is the last value
 * @param value - the value yielded in place of the value at `index`
 * @returns a lazy, re-runnable `Iterable` of the values, with `value` at `index`
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `index` is not an integer (fractions, `NaN` and `Infinity` included);
 * when the source ends, if it has no value at `index`
 * @example
 * ```ts
 * Array.from(Functions.with([1, 2, 3], 1, 20)); // [1, 20, 3]
 * Array.from(Functions.with([1, 2, 3], -1, 30)); // [1, 2, 30]
 * ```
 * @since 0.10.0
 */
export function withValue<T>(iterable: Iterable<T>, index: number, value: T): Iterable<T> {
	Validations.throwIfNotIterable(iterable, 'with');
	Validations.throwIfNotInteger(index, 'index', 'with');
	return index >= 0
		? new DeferredIterable(() => new WithFromStartIterator(iterable, index, value))
		: new DeferredIterable(() => new WithFromEndIterator(iterable, -index, value));
}

function outOfRange(count: number): Error {
	return libraryError('with', `The "index" parameter is out of range: the source has ${count} values`);
}

/**
 * A non-negative index: the values are yielded as they are read, `value` at `index`.
 */
class WithFromStartIterator<T> extends SourceIterator<T, T> {
	constructor(iterable: Iterable<T>, private readonly target: number, private readonly value: T) {
		super(iterable);
	}

	protected advance(): IteratorResult<T> {
		const n = this.source.next();
		if (n.done === true) {
			if (this.index <= this.target)
				throw outOfRange(this.index);
			return n;
		}
		return this.index++ === this.target ? getContinueIteratorResult(this.value) : n;
	}
}

/**
 * A negative index: a circular buffer delays the values by `size`. When the source ends, the oldest value in the buffer is the one
 * at `length - size`: it is replaced by `value`, then the buffer is yielded.
 */
class WithFromEndIterator<T> extends SourceIterator<T, T> {
	private buffer: T[] = [];
	private position = 0;
	private full = false;
	/** How many values of the buffer are still to yield, once the source has ended. */
	private remaining?: number;

	constructor(iterable: Iterable<T>, private readonly size: number, private readonly value: T) {
		super(iterable);
	}

	protected advance(): IteratorResult<T> {
		if (this.remaining === undefined) {
			for (let n = this.source.next(); n.done !== true; n = this.source.next()) {
				if (this.full) {
					// the oldest value in the buffer is the one `size` values behind: it is yielded and replaced
					const oldest = this.buffer[this.position];
					this.store(n.value);
					return getContinueIteratorResult(oldest);
				}
				this.store(n.value);
			}
			if (!this.full)
				throw outOfRange(this.position);
			this.buffer[this.position] = this.value;
			this.remaining = this.size;
		}
		if (this.remaining === 0) {
			this.buffer = [];
			return getDoneIteratorResult();
		}
		this.remaining--;
		const value = this.buffer[this.position];
		if (++this.position === this.size)
			this.position = 0;
		return getContinueIteratorResult(value);
	}

	private store(value: T): void {
		this.buffer[this.position] = value;
		// a branch instead of `% size`, as in `slice`
		if (++this.position === this.size) {
			this.position = 0;
			this.full = true;
		}
	}
}
