import { DeferredIterable } from '../iterators';
import { Tapper } from '../types';
import { Validations } from '../utils';

/**
 * Calls `tapper` with `iterable` each time a new iteration starts.
 * @operation `Tap`
 * @param iterable - the source `Iterable`
 * @param tapper - called with `iterable` (the index is always 0)
 * @returns a lazy, re-runnable `Iterable` of the same values
 */
export function tapChain<T>(iterable: Iterable<T>, tapper: Tapper<Iterable<T>>): Iterable<T> {
	Validations.throwIfNotIterable(iterable);
	Validations.throwIfNotFunction(tapper, 'tapper');
	return new DeferredIterable(() => {
		tapper(iterable, 0);
		return iterable[Symbol.iterator]();
	});
}
