/**
 * Lazy and re-runnable iterable: every `[Symbol.iterator]()` call creates a new iterator.
 */
export class DeferredIterable<T> implements Iterable<T> {
	constructor(private readonly createIterator: () => Iterator<T>) {}

	[Symbol.iterator](): Iterator<T> {
		return this.createIterator();
	}
}
