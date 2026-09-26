import { SourceIterator, DeferredIterable } from '../iterators';
import { Tapper } from '../types';
import { Validations } from '../utils';

/**
 *
 * @operation `Tap`
 * @param iterable
 * @param tapper
 * @returns
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
