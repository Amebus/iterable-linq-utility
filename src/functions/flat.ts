import { DeferredIterable, SourceIterator } from '../iterators';
import type { FlatIterable } from '../types';
import { getContinueIteratorResult, isFunction, libraryError, Validations } from '../utils';

/**
 * Lazily flattens the nested iterables of `iterable` up to `depth` levels, like `Array.prototype.flat` for any `Iterable`.
 * Strings, primitive or `String` objects, are not flattened. Nested arrays are read by index: their `[Symbol.iterator]` is not called.
 * If a nested iterable throws, the iterables that contain it and the source are closed, and the error propagates.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param depth - how many levels to flatten, `1` by default; a non-negative integer or `Infinity`
 * @returns a lazy, re-runnable `Iterable` of the flattened values
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `depth` is not a non-negative integer or `Infinity`
 * @example
 * ```ts
 * Array.from(Functions.flat([1, [2, [3]], new Set([4])])); // [1, 2, [3], 4]
 * Array.from(Functions.flat([1, [2, [3]]], Infinity)); // [1, 2, 3]
 * ```
 * @since 0.10.0
 */
export function flat<T, D extends number = 1>(iterable: Iterable<T>, depth?: D): Iterable<FlatIterable<T, D>> {
	Validations.throwIfNotIterable(iterable, 'flat');
	if (depth !== undefined && depth !== Infinity && !(Number.isInteger(depth) && depth >= 0))
		throw libraryError('flat', 'The "depth" parameter must be a non-negative integer or Infinity');
	const levels = depth ?? 1;
	return new DeferredIterable(() => new FlatIterator(iterable, levels)) as Iterable<FlatIterable<T, D>>;
}

/**
 * Whether `flat` opens `value`: an `Iterable` that is not a string.
 */
function isFlattenable(value: unknown): value is Iterable<unknown> {
	return value != null
		&& typeof value !== 'string'
		&& !(value instanceof String)
		&& isFunction((value as Iterable<unknown>)[Symbol.iterator]);
}

/**
 * A nested array, read by index.
 */
class ArrayLevel {
	position = 0;

	constructor(readonly array: readonly unknown[]) {}
}

type Level = ArrayLevel | Iterator<unknown>;

class FlatIterator extends SourceIterator<unknown, unknown> {
	/** The nested iterables being read, the innermost last; the source is below them. */
	private readonly levels: Level[] = [];

	constructor(iterable: Iterable<unknown>, private readonly depth: number) {
		super(iterable);
	}

	protected advance(): IteratorResult<unknown> {
		for (;;) {
			const level = this.levels.at(-1);
			let value: unknown;
			if (level === undefined) {
				const n = this.source.next();
				if (n.done === true)
					return n;
				value = n.value;
			} else if (level instanceof ArrayLevel) {
				// the length is read at every step, as the array iterator does
				if (level.position === level.array.length) {
					this.levels.pop();
					continue;
				}
				value = level.array[level.position++];
			} else {
				const n = this.nextNested(level);
				if (n.done === true) {
					this.levels.pop();
					continue;
				}
				value = n.value;
			}
			if (this.levels.length < this.depth && isFlattenable(value))
				this.open(value);
			else
				return getContinueIteratorResult(value);
		}
	}

	/**
	 * Closes the nested iterators from the innermost, then the source: an iterator that throws on `return()` does not leave the others open.
	 */
	protected override onReturn(value?: any): void {
		const level = this.levels.pop();
		if (level === undefined) {
			super.onReturn(value);
			return;
		}
		try {
			if (!(level instanceof ArrayLevel))
				level.return?.(value);
		} finally {
			this.onReturn(value);
		}
	}

	/**
	 * Adds `value` on top of the levels. If its `[Symbol.iterator]` throws, the open iterators and the source are closed.
	 */
	private open(value: Iterable<unknown>): void {
		if (Array.isArray(value)) {
			this.levels.push(new ArrayLevel(value));
			return;
		}
		try {
			this.levels.push(value[Symbol.iterator]());
		} catch (error) {
			this.closeAfterCallbackError();
			throw error;
		}
	}

	/**
	 * Reads a nested iterator. If it throws, only the iterators below it and the source are closed: it already failed.
	 */
	private nextNested(level: Iterator<unknown>): IteratorResult<unknown> {
		try {
			return level.next();
		} catch (error) {
			this.levels.pop();
			this.closeAfterCallbackError();
			throw error;
		}
	}
}
