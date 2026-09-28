import { DeferredIterable, SourceIterator } from '../iterators';
import { Mapper } from '../types';
import { Validations } from '../utils';

/**
 * Lazily maps each value to an `Iterable` and flattens the results.
 * Each inner `Iterable` is read completely before the next value is mapped.
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
	Validations.throwIfNotIterable(iterable);
	Validations.throwIfNotFunction(mapper, 'mapper');
	return new DeferredIterable(() => new FlatMapIterator(iterable, mapper));
}

type FlatMapState = 'outer' | 'inner';

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
			try {
				it.inner = it.mapper(n.value, it.index++)[Symbol.iterator]();
			} catch (error) {
				it.closeAfterCallbackError();
				throw error;
			}
			it.state = 'inner';
			return undefined;
		},
		inner: it => {
			const n = FlatMapIterator.nextInner(it);
			if (n.done !== true)
				return n;
			it.inner = undefined;
			it.state = 'outer';
			return undefined;
		}
	};

	private state: FlatMapState = 'outer';
	private inner?: Iterator<R>;

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
		try {
			this.inner?.return?.(value);
		} finally {
			super.onReturn(value);
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
