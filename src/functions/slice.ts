import { SourceIterator, DeferredIterable } from '../iterators';
import { getContinueIteratorResult, getDoneIteratorResult, Validations } from '../utils';

/**
 * Lazily yields the values from `start` to `end` (excluded), like `Array.prototype.slice`; a negative index counts from the end.
 * With non-negative indexes the values are yielded as they are read, and the source is closed at `end`, so `slice` also ends an infinite source.
 * A negative `end` yields each value once `-end` more values have been read, keeping only those `-end` values.
 * A negative `start` reads the whole source before yielding, keeping only the last `-start` values.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param start - an integer, `0` by default; `-1` is the last value
 * @param end - an integer; the values are yielded up to the end of the source by default
 * @returns a lazy, re-runnable `Iterable` of the values from `start` to `end`
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `start` or `end` is given and is not an integer (fractions, `NaN` and `Infinity` included)
 * @example
 * ```ts
 * Array.from(Functions.slice([1, 2, 3, 4, 5], 1, 3)); // [2, 3]
 * Array.from(Functions.slice([1, 2, 3, 4, 5], -2)); // [4, 5]
 * ```
 * @since 0.8.0
 */
export function slice<T>(iterable: Iterable<T>, start?: number, end?: number): Iterable<T> {
	Validations.throwIfNotIterable(iterable, 'slice');
	if (start !== undefined)
		Validations.throwIfNotInteger(start, 'start', 'slice');
	if (end !== undefined)
		Validations.throwIfNotInteger(end, 'end', 'slice');
	const from = start ?? 0;
	if (from < 0)
		return new DeferredIterable(() => new SliceFromEndIterator(iterable, -from, end));
	if (end !== undefined && end < 0)
		return new DeferredIterable(() => new SliceToEndIterator(iterable, from, -end));
	// an `end` not after `start` yields nothing: 0 closes the source without reading it
	const to = end === undefined ? Infinity : end > from ? end : 0;
	return new DeferredIterable(() => new SliceIterator(iterable, from, to));
}

/**
 * Non-negative indexes: skips the values before `start`, yields the values up to `end`, then closes the source.
 */
class SliceIterator<T> extends SourceIterator<T, T> {
	constructor(iterable: Iterable<T>, private readonly start: number, private readonly end: number) {
		super(iterable);
	}

	protected advance(): IteratorResult<T> {
		if (this.index >= this.end) {
			this.source.return?.();
			return getDoneIteratorResult();
		}
		while (this.index < this.start) {
			const n = this.source.next();
			if (n.done === true)
				return n;
			this.index++;
		}
		const n = this.source.next();
		if (n.done !== true)
			this.index++;
		return n;
	}
}

/**
 * A non-negative `start` and a negative `end`: skips the values before `start`, then a circular buffer delays the values by `size`,
 * and a value is yielded once `size` more values have been read.
 */
class SliceToEndIterator<T> extends SourceIterator<T, T> {
	private readonly buffer: T[] = [];
	private position = 0;
	private full = false;

	constructor(iterable: Iterable<T>, private readonly start: number, private readonly size: number) {
		super(iterable);
	}

	protected advance(): IteratorResult<T> {
		while (this.index < this.start) {
			const n = this.source.next();
			if (n.done === true)
				return n;
			this.index++;
		}
		for (let n = this.source.next(); n.done !== true; n = this.source.next()) {
			if (this.full) {
				// the oldest value in the buffer is the one `size` values behind: it is yielded and replaced
				const value = this.buffer[this.position];
				this.store(n.value);
				return getContinueIteratorResult(value);
			}
			this.store(n.value);
		}
		return getDoneIteratorResult();
	}

	private store(value: T): void {
		this.buffer[this.position] = value;
		// a branch instead of `% size`, as in `at`
		if (++this.position === this.size) {
			this.position = 0;
			this.full = true;
		}
	}
}

/**
 * A negative `start`: the whole source is read into a circular buffer of the last `size` values,
 * then the values of the buffer before `end` are yielded.
 */
class SliceFromEndIterator<T> extends SourceIterator<T, T> {
	private buffer?: T[];
	/** The position in the buffer of the next value to yield. */
	private position = 0;
	/** How many values of the buffer are still to yield. */
	private remaining = 0;

	constructor(iterable: Iterable<T>, private readonly size: number, private readonly end: number | undefined) {
		super(iterable);
	}

	protected advance(): IteratorResult<T> {
		this.buffer ??= this.fill();
		if (this.remaining === 0) {
			this.buffer = [];
			return getDoneIteratorResult();
		}
		this.remaining--;
		const value = this.buffer[this.position];
		if (++this.position === this.buffer.length)
			this.position = 0;
		return getContinueIteratorResult(value);
	}

	/**
	 * Reads the whole source and sets `position` on the oldest value kept and `remaining` on the values before `end`.
	 */
	private fill(): T[] {
		const buffer: T[] = [];
		let length = 0;
		let position = 0;
		// a branch instead of `length % size`, as in `at`
		for (let n = this.source.next(); n.done !== true; n = this.source.next()) {
			buffer[position] = n.value;
			length++;
			if (++position === this.size)
				position = 0;
		}
		const end = this.end === undefined ? length : this.end < 0 ? Math.max(length + this.end, 0) : Math.min(this.end, length);
		// once more than `size` values are read, the oldest value kept is the next one to be overwritten
		this.position = length > this.size ? position : 0;
		this.remaining = Math.max(end - (length - buffer.length), 0);
		return buffer;
	}
}
