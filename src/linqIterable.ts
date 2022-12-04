export class LinqIterable<T> implements Iterable<T> {

	constructor(iterable: Iterable<T>) {
		this.iterable = iterable;
	}
	[Symbol.iterator](): Iterator<T, any, undefined> {
		return this.iterable[Symbol.iterator]();
	}

	private iterable: Iterable<T>;

	collectToArray(): T[] {
		return [...this.source];
	}

	get source(): Iterable<T> {
		return this.iterable;
	}
}
