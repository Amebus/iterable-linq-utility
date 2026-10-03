import { DeferredIterable, SourceIterator } from '../iterators';
import { Mapper } from '../types';
import { getContinueIteratorResult, Validations } from '../utils';

/**
 * Lazily maps each value to an `Iterable` and flattens the results.
 * Each inner `Iterable` is read completely before the next value is mapped.
 * Inner arrays are read by index, as in `Array.prototype.flatMap`: their `[Symbol.iterator]` is not called.
 * If `mapper` or an inner `Iterable` throws, the source is closed and the error propagates.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param mapper - called with each value and its index; returns the `Iterable` to flatten
 * @returns a lazy, re-runnable `Iterable` of the flattened values
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `mapper` is not a function
 * @example
 * ```ts
 * Array.from(Functions.flatMap([1, 2], v => [v, v * 10])); // [1, 10, 2, 20]
 * ```
 * @since 0.0.11
 */
export function flatMap<T, R>(iterable: Iterable<T>, mapper: Mapper<T, Iterable<R>>): Iterable<R> {
	Validations.throwIfNotIterable(iterable, 'flatMap');
	Validations.throwIfNotFunction(mapper, 'mapper', 'flatMap');
	return new DeferredIterable(() => new FlatMapIterator(iterable, mapper));
}

type FlatMapState = 'outer' | 'inner' | 'array';

/**
 * A step returns the next result, or `undefined` when it only changed state.
 */
type FlatMapStep = <T, R>(it: FlatMapIterator<T, R>) => IteratorResult<R> | undefined;

class FlatMapIterator<T, R> extends SourceIterator<T, R> {
	/**
	 * Transition table: one step per state. Static, so the steps can read the iterator's protected members.
	 */
	private static readonly steps: Readonly<Record<FlatMapState, FlatMapStep>> = {
		outer: it => {
			const n = it.source.next();
			if (n.done === true)
				return n;
			const array = FlatMapIterator.mapNext(it, n.value);
			if (array === undefined) {
				it.state = 'inner';
				return undefined;
			}
			// an array gives its first value at once, and an empty one is skipped without a state change
			if (array.length === 0)
				return undefined;
			it.array = array;
			it.position = 1;
			it.state = 'array';
			return getContinueIteratorResult(array[0]);
		},
		inner: it => {
			const n = FlatMapIterator.nextInner(it);
			if (n.done !== true)
				return n;
			it.inner = undefined;
			it.state = 'outer';
			return undefined;
		},
		array: it => {
			// the length is read at every step, as the array iterator does
			if (it.position < it.array!.length)
				return getContinueIteratorResult(it.array![it.position++]);
			it.array = undefined;
			it.state = 'outer';
			return undefined;
		}
	};

	private state: FlatMapState = 'outer';
	private inner?: Iterator<R>;
	private array?: readonly R[];
	private position = 0;

	constructor(iterable: Iterable<T>, private readonly mapper: Mapper<T, Iterable<R>>) {
		super(iterable);
	}

	protected advance(): IteratorResult<R> {
		for (;;) {
			const result = FlatMapIterator.steps[this.state](this);
			if (result !== undefined)
				return result;
		}
	}

	protected override onReturn(value?: any): void {
		this.array = undefined;
		try {
			this.inner?.return?.(value);
		} finally {
			super.onReturn(value);
		}
	}

	/**
	 * Maps the next source value. Returns an array as it is; for any other `Iterable`, opens `inner` and returns `undefined`.
	 * If the mapper or `[Symbol.iterator]` throws, the source is closed.
	 */
	private static mapNext<T, R>(it: FlatMapIterator<T, R>, value: T): readonly R[] | undefined {
		try {
			const mapped = it.mapper(value, it.index++);
			if (Array.isArray(mapped))
				return mapped;
			it.inner = mapped[Symbol.iterator]();
			return undefined;
		} catch (error) {
			it.closeAfterCallbackError();
			throw error;
		}
	}

	/**
	 * Reads the inner iterator. If it throws, only the outer source is closed: the inner iterator already failed.
	 */
	private static nextInner<T, R>(it: FlatMapIterator<T, R>): IteratorResult<R> {
		try {
			return it.inner!.next();
		} catch (error) {
			it.inner = undefined;
			it.closeAfterCallbackError();
			throw error;
		}
	}
}
