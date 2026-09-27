import { DeferredIterable } from '../iterators';
import { Tapper } from '../types';
import { Validations } from '../utils';

/**
 * Calls `tapper` with `iterable` each time a new iteration starts, before the first value is read.
 * @operation `Tap`
 * @param iterable - the source `Iterable`
 * @param tapper - called with `iterable` (the index is always 0); returns `unit()`
 * @returns a lazy, re-runnable `Iterable` of the same values
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `tapper` is not a function
 * @example
 * ```ts
 * const tapped = Functions.tapChain([1, 2], () => { console.log('run'); return unit(); });
 * Array.from(tapped); // logs "run"
 * Array.from(tapped); // logs "run" again
 * ```
 * @since 0.0.10
 */
export function tapChain<T>(iterable: Iterable<T>, tapper: Tapper<Iterable<T>>): Iterable<T> {
	Validations.throwIfNotIterable(iterable);
	Validations.throwIfNotFunction(tapper, 'tapper');
	return new DeferredIterable(() => {
		tapper(iterable, 0);
		return iterable[Symbol.iterator]();
	});
}
