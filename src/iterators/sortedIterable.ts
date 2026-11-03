import type { Comparer } from '../types';
import { getContinueIteratorResult, getDoneIteratorResult, orderOf, pairOrderOf, PartialSort, sortValues } from '../utils';
import { DeferredIterable } from './deferredIterable';
import { SourceIterator } from './sourceIterator';

/**
 * The iterable returned by `sort`, which `skip`, `take` and `slice` recognise (ADR 0031): read alone, it sorts the whole source
 * and skips the first `offset` values; `window` sorts only the values it yields, when the rule of the partial sort allows it.
 */
export class SortedIterable<T> extends DeferredIterable<T> {
	constructor(
		readonly source: Iterable<T>,
		readonly comparer: Comparer<T> | undefined,
		readonly descending: boolean,
		readonly offset: number
	) {
		super(() => new SortedIterator(source, comparer, descending, offset, Infinity));
	}

	/** The same sort, skipping `count` more values. */
	withOffset(count: number): SortedIterable<T> {
		return new SortedIterable(this.source, this.comparer, this.descending, this.offset + count);
	}

	/** The positions `[start, end)` of the sorted values, after the offset; an `end` not after `start` reads nothing. */
	window(start: number, end: number): Iterable<T> {
		const from = this.offset + start;
		const to = end > start ? this.offset + end : from;
		return new DeferredIterable(() => new SortedIterator(this.source, this.comparer, this.descending, from, to));
	}
}

/** Yields the positions `[start, end)` of the sorted values; an empty window closes the source without reading it. */
class SortedIterator<T> extends SourceIterator<T, T> {
	/** The sorted values, or only those of the window, read on the first `next()`. */
	private sorted?: T[];
	private position = 0;
	private last = 0;

	constructor(
		iterable: Iterable<T>,
		private readonly comparer: Comparer<T> | undefined,
		private readonly descending: boolean,
		private readonly start: number,
		private readonly end: number
	) {
		super(iterable);
	}

	protected advance(): IteratorResult<T> {
		if (this.sorted === undefined) {
			if (this.start >= this.end) {
				this.source.return?.();
				return getDoneIteratorResult();
			}
			this.sorted = this.fill();
		}
		return this.position < this.last ? getContinueIteratorResult(this.sorted[this.position++]) : getDoneIteratorResult();
	}

	protected override onReturn(value?: any): void {
		this.sorted = undefined;
		super.onReturn(value);
	}

	/**
	 * Reads the whole source, then sorts it, or only the window. An error of the source propagates as it is; an error of the
	 * compare function or of a key closes the iterator first.
	 */
	private fill(): T[] {
		const values: T[] = [];
		for (let n = this.source.next(); n.done !== true; n = this.source.next())
			values.push(n.value);
		const end = Math.min(this.end, values.length);
		if (this.start >= end)
			return [];
		try {
			return this.sort(values, end);
		} catch (error) {
			this.closeAfterCallbackError();
			throw error;
		}
	}

	/**
	 * The partial sort when the rule chooses it and it does not give up, otherwise the full sort, as `sort` alone. With half the
	 * pairs of the sample out of order, `choosePath` decides on the sizes alone, so the sample is read only when it counts. The
	 * sample reads only the values and keys of its pairs; the order of every index is built only for the partial sort.
	 */
	private sort(values: T[], end: number): T[] {
		const n = values.length;
		if (PartialSort.choosePath(n, end, PartialSort.sampleSize(n) >> 1) === 'select') {
			const descents = PartialSort.countSampleDescents(n, pairOrderOf(values, this.comparer, this.descending));
			if (PartialSort.choosePath(n, end, descents) === 'select') {
				const indices = PartialSort.selectWindow(n, orderOf(values, this.comparer, this.descending), this.start, end);
				if (indices !== undefined) {
					this.last = indices.length;
					return indices.map(i => values[i]);
				}
			}
		}
		this.position = this.start;
		this.last = end;
		return sortValues(values, this.comparer, this.descending);
	}
}
