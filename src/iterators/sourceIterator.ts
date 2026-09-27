import { BaseIterator } from './baseIterator';

/**
 * Base class of the iterators that read from one upstream iterable.
 * Stopping early closes the upstream iterator.
 */
export abstract class SourceIterator<S, T> extends BaseIterator<T> {
	protected readonly source: Iterator<S>;
	protected index = 0;

	constructor(iterable: Iterable<S>) {
		super();
		this.source = iterable[Symbol.iterator]();
	}

	protected override onReturn(value?: any): void {
		this.source.return?.(value);
	}
}
