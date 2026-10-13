import { DeferredIterable, SourceIterator } from '../iterators';
import { KeysOfType, Mapper } from '../types';
import { getContinueIteratorResult, isPropertyKey, Validations } from '../utils';

/**
 * Lazily maps each value to an `Iterable` and flattens the results.
 * Each inner `Iterable` is read completely before the next value is mapped.
 * Inner arrays are read by index, as in `Array.prototype.flatMap`: their `[Symbol.iterator]` is not called.
 * If `mapper` or an inner `Iterable` throws, the source is closed and the error propagates.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param mapper - called with each value and its index; returns the `Iterable` to flatten
 * @returns a lazy, re-runnable `Iterable` of the flattened values
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `mapper` is neither a function nor a property key
 * @example
 * ```ts
 * Array.from(Functions.flatMap([1, 2], v => [v, v * 10])); // [1, 10, 2, 20]
 * ```
 * @since 0.0.11
 */
export function flatMap<T, R>(iterable: Iterable<T>, mapper: Mapper<T, Iterable<R>>): Iterable<R>;
/**
 * Lazily flattens the property `key` of each value, an `Iterable`: the same as `flatMap(iterable, v => v[key])`.
 * A value that is `null` or `undefined` throws a `TypeError`: the source is closed and the error propagates.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param key - a property whose value is an `Iterable`
 * @returns a lazy, re-runnable `Iterable` of the flattened values
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `key` is neither a function nor a property key
 * @example
 * ```ts
 * Array.from(Functions.flatMap([{ tags: ['a', 'b'] }, { tags: ['c'] }], 'tags')); // ['a', 'b', 'c']
 * ```
 * @since next
 */
export function flatMap<T, P extends KeysOfType<T, Iterable<unknown>>>(iterable: Iterable<T>, key: P): Iterable<T[P] extends Iterable<infer R> ? R : never>;
export function flatMap<T, R>(iterable: Iterable<T>, mapper: Mapper<T, Iterable<R>> | PropertyKey): Iterable<R> {
	Validations.throwIfNotIterable(iterable, 'flatMap');
	Validations.throwIfNotSelector(mapper, 'mapper', 'flatMap');
	if (isPropertyKey(mapper))
		return new DeferredIterable(() => new FlatMapKeyIterator<T, R>(iterable, mapper));
	return new DeferredIterable(() => new FlatMapIterator(iterable, mapper));
}

type FlatMapState = 'outer' | 'inner' | 'array';

/**
 * A step returns the next result, or `undefined` when it only changed state.
 */
type FlatMapStep = <T, R>(it: FlatMapIteratorBase<T, R>) => IteratorResult<R> | undefined;

/**
 * The states and the steps of `flatMap`; a subclass maps a value to its `Iterable`: with the mapper, or by reading a property key (ADR 0025).
 */
abstract class FlatMapIteratorBase<T, R> extends SourceIterator<T, R> {
	/**
	 * Transition table: one step per state. Static, so the steps can read the iterator's protected members.
	 */
	private static readonly steps: Readonly<Record<FlatMapState, FlatMapStep>> = {
		outer: it => {
			const n = it.source.next();
			if (n.done === true)
				return n;
			const array = FlatMapIteratorBase.mapNext(it, n.value);
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
			const n = FlatMapIteratorBase.nextInner(it);
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

	protected advance(): IteratorResult<R> {
		for (;;) {
			const result = FlatMapIteratorBase.steps[this.state](this);
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
	 * If the mapping or `[Symbol.iterator]` throws, the source is closed.
	 */
	private static mapNext<T, R>(it: FlatMapIteratorBase<T, R>, value: T): readonly R[] | undefined {
		try {
			const mapped = it.mapValue(value);
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
	private static nextInner<T, R>(it: FlatMapIteratorBase<T, R>): IteratorResult<R> {
		try {
			return it.inner!.next();
		} catch (error) {
			it.inner = undefined;
			it.closeAfterCallbackError();
			throw error;
		}
	}

	/** Maps a value of the source to the `Iterable` to flatten. */
	protected abstract mapValue(value: T): Iterable<R>;
}

class FlatMapIterator<T, R> extends FlatMapIteratorBase<T, R> {
	constructor(iterable: Iterable<T>, private readonly mapper: Mapper<T, Iterable<R>>) {
		super(iterable);
	}

	protected mapValue(value: T): Iterable<R> {
		return this.mapper(value, this.index++);
	}
}

class FlatMapKeyIterator<T, R> extends FlatMapIteratorBase<T, R> {
	constructor(iterable: Iterable<T>, private readonly key: PropertyKey) {
		super(iterable);
	}

	protected mapValue(value: T): Iterable<R> {
		return (value as any)[this.key];
	}
}
