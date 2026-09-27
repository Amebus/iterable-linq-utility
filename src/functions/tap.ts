import { SourceIterator, DeferredIterable } from '../iterators';
import { Tapper } from '../types';
import { Validations } from '../utils';

/**
 * Lazily calls `tapper` on each value as it flows through, without changing it.
 * @operation `Tap`
 * @param iterable - the source `Iterable`
 * @param tapper - called with each value and its index; returns `unit()`
 * @returns a lazy, re-runnable `Iterable` of the same values
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `tapper` is not a function
 * @example
 * ```ts
 * const logged = Functions.tap([1, 2], v => { console.log(v); return unit(); });
 * Array.from(logged); // logs 1, 2; returns [1, 2]
 * ```
 * @since 0.0.10
 */
export function tap<T>(iterable: Iterable<T>, tapper: Tapper<T>): Iterable<T> {
	Validations.throwIfNotIterable(iterable);
	Validations.throwIfNotFunction(tapper, 'tapper');
	return new DeferredIterable(() => new TapIterator(iterable, tapper));
}

class TapIterator<T> extends SourceIterator<T, T> {
	constructor(iterable: Iterable<T>, private readonly tapper: Tapper<T>) {
		super(iterable);
	}

	protected advance(): IteratorResult<T> {
		const n = this.source.next();
		if (n.done !== true)
			this.tapper(n.value, this.index++);
		return n;
	}
}
