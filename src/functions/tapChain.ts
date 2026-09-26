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
	return new TapChainIterable(iterable, tapper);
}

class TapChainIterable <T> implements Iterable<T> {

	constructor(iterable: Iterable<T>, tapper: Tapper<Iterable<T>>) {
		this.source = iterable;
		this.tapper = tapper;
	}

	[Symbol.iterator](): Iterator<T, any, undefined> {
		this.tapper(this.source, 0);
		return this.source[Symbol.iterator]();
	}

	private tapper: Tapper<Iterable<T>>;
	private source: Iterable<T>;
}
