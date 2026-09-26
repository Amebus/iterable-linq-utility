import { DeferredIterable } from '../iterators';
import { Tapper } from '../types';
import { Validations } from '../utils';

/**
 *
 * @operation `Tap`
 * @param iterable
 * @param tapper
 * @returns
 */
export function tapChain<T>(iterable: Iterable<T>, tapper: Tapper<Iterable<T>>): Iterable<T> {
	Validations.throwIfNotIterable(iterable);
	Validations.throwIfNotFunction(tapper, 'tapper');
	return new DeferredIterable(() => {
		tapper(iterable, 0);
		return iterable[Symbol.iterator]();
	});
}
