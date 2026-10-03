import { SourceIterator, DeferredIterable } from '../iterators';
import { Predicate } from '../types';
import { getDoneIteratorResult, Validations } from '../utils';

/**
 * Lazily yields the values while a type guard accepts them, narrowing their type, then closes the source.
 * The source is never read past the first rejected value, which is not yielded.
 * If `predicate` throws, the source is closed and the error propagates.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param predicate - a type guard called with each value and its index; the first `false` ends the iterable
 * @returns a lazy, re-runnable `Iterable` of the narrowed values before the first rejected one
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `predicate` is not a function
 * @example
 * ```ts
 * const values: (number | string)[] = [1, 2, 'three', 4];
 * Array.from(Functions.takeWhile(values, (v): v is number => typeof v === 'number')); // number[], [1, 2]
 * ```
 * @since 0.5.0
 */
export function takeWhile<T, S extends T>(iterable: Iterable<T>, predicate: (value: T, index: number) => value is S): Iterable<S>;

/**
 * Lazily yields the values while `predicate` returns `true`, then closes the source.
 * The source is never read past the first rejected value, which is not yielded, so `takeWhile` can end an infinite source.
 * If `predicate` throws, the source is closed and the error propagates.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param predicate - called with each value and its index; the first `false` ends the iterable
 * @returns a lazy, re-runnable `Iterable` of the values before the first rejected one
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `predicate` is not a function
 * @example
 * ```ts
 * Array.from(Functions.takeWhile([1, 2, 5, 3], v => v < 4)); // [1, 2]
 * ```
 * @since 0.5.0
 */
export function takeWhile<T>(iterable: Iterable<T>, predicate: Predicate<T>): Iterable<T>;
export function takeWhile<T>(iterable: Iterable<T>, predicate: Predicate<T>): Iterable<T> {
	Validations.throwIfNotIterable(iterable, 'takeWhile');
	Validations.throwIfNotFunction(predicate, 'predicate', 'takeWhile');
	return new DeferredIterable(() => new TakeWhileIterator(iterable, predicate));
}

class TakeWhileIterator<T> extends SourceIterator<T, T> {
	constructor(iterable: Iterable<T>, private readonly predicate: Predicate<T>) {
		super(iterable);
	}

	protected advance(): IteratorResult<T> {
		const n = this.source.next();
		if (n.done === true)
			return n;
		let keep: boolean;
		try {
			keep = this.predicate(n.value, this.index++);
		} catch (error) {
			this.closeAfterCallbackError();
			throw error;
		}
		if (keep)
			return n;
		this.source.return?.();
		return getDoneIteratorResult();
	}
}
