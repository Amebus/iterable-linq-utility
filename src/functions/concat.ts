import { BaseIterator, DeferredIterable } from '../iterators';
import { Validations } from '../utils';

/**
 * Lazily yields the values of `iterable`, then the values of each iterable in `others`, in order.
 * Each iterable is opened only when the previous one ends, so the iterables after an infinite one are never read.
 * Stopping early closes only the iterable being read.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param others - the iterables read after the source
 * @returns a lazy, re-runnable `Iterable` of the values of the source followed by the values of `others`
 * @throws Error if `iterable` or a value of `others` is missing or does not implement `[Symbol.iterator]`
 * @example
 * ```ts
 * Array.from(Functions.concat([1, 2], [3], new Set([4, 5]))); // [1, 2, 3, 4, 5]
 * ```
 * @since next
 */
export function concat<T>(iterable: Iterable<T>, ...others: Iterable<T>[]): Iterable<T> {
	Validations.throwIfNotIterable(iterable, 'concat');
	for (const other of others)
		Validations.throwIfNotIterable(other, 'concat');
	// copies the references of the rest parameter: no iterable is opened here, each one is opened in advance()
	const sources = [iterable, ...others];
	return new DeferredIterable(() => new ConcatIterator(sources));
}

/**
 * Reads the sources one after the other: only the source being read is open.
 */
class ConcatIterator<T> extends BaseIterator<T> {
	private position = 0;
	private current?: Iterator<T>;

	constructor(private readonly sources: readonly Iterable<T>[]) {
		super();
		this.current = sources[0][Symbol.iterator]();
	}

	protected advance(): IteratorResult<T> {
		for (;;) {
			const n = this.current!.next();
			if (n.done !== true || ++this.position === this.sources.length)
				return n;
			// cleared first: if opening the next source throws, return() has nothing to close
			this.current = undefined;
			this.current = this.sources[this.position][Symbol.iterator]();
		}
	}

	protected override onReturn(value?: any): void {
		this.current?.return?.(value);
	}
}
