export class LinqIterable<T> implements Iterable<T> {

	constructor(iterable: Iterable<T>) {
		this.iterable = iterable;
	}
	[Symbol.iterator](): Iterator<T, any, undefined> {
		return this.iterable[Symbol.iterator]();
	}

	private iterable: Iterable<T>;

	source(): Iterable<T> {
		return this.iterable;
	}

	collectToArray(): T[] {
		return [...this.source()];
	}
}
