import { BaseIterator } from '../iterators';
import { getContinueIteratorResult, getDoneIteratorResult, Validations } from '../utils';

export interface IMemoizeOptions {
	allowPartialMemoization?: boolean;
}

export function getMemoizeDefaultOptions(): IMemoizeOptions {
	return {
		allowPartialMemoization: true
	};
}

/**
 * Caches the values of `iterable` the first time they are read, so later iterations do not re-run the source.
 * With partial memoization, a consumer that stops early keeps the shared source open until another consumer finishes it.
 * @operation `Transformation`
 * @param iterable
 * @returns
 */
export function memoize<T>(iterable: Iterable<T>, options?: IMemoizeOptions): Iterable<T> {
	Validations.throwIfNotIterable(iterable);

	const opt = {
		...getMemoizeDefaultOptions(),
		...options
	};

	const allowPartialMemoization = opt.allowPartialMemoization;

	if (iterable instanceof MemoizeAsFullIterable) {
		if (allowPartialMemoization)
			return iterable.changePartialMemoizationBehaviour();
		return iterable;
	}
	if (iterable instanceof MemoizeAsPartialIterable) {
		if (allowPartialMemoization)
			return iterable;
		return iterable.changePartialMemoizationBehaviour();
	}

	if (allowPartialMemoization)
		return new MemoizeAsPartialIterable(iterable);
	return new MemoizeAsFullIterable(iterable);
}

interface IMemoizeCache<T> {
	readonly values: T[];
	source?: Iterator<T>;
	finished: boolean;
}

function createCache<T>(): IMemoizeCache<T> {
	return { values: [], finished: false };
}

/**
 * Reads one more value from the source into the cache.
 * @returns false when the source is exhausted
 */
function pull<T>(iterable: Iterable<T>, cache: IMemoizeCache<T>): boolean {
	if (cache.finished)
		return false;
	cache.source ??= iterable[Symbol.iterator]();
	const n = cache.source.next();
	if (n.done === true) {
		cache.finished = true;
		cache.source = undefined;
		return false;
	}
	cache.values.push(n.value);
	return true;
}

class MemoizeAsFullIterable<T> implements Iterable<T> {
	private readonly cache = createCache<T>();

	constructor(private readonly source: Iterable<T>) {}

	[Symbol.iterator](): Iterator<T> {
		return new MemoizeIterator(this.source, this.cache, true);
	}

	changePartialMemoizationBehaviour(): MemoizeAsPartialIterable<T> {
		return new MemoizeAsPartialIterable(this.source);
	}
}

class MemoizeAsPartialIterable<T> implements Iterable<T> {
	private readonly cache = createCache<T>();

	constructor(private readonly source: Iterable<T>) {}

	[Symbol.iterator](): Iterator<T> {
		return new MemoizeIterator(this.source, this.cache, false);
	}

	changePartialMemoizationBehaviour(): MemoizeAsFullIterable<T> {
		return new MemoizeAsFullIterable(this.source);
	}
}

/**
 * One consumer of a memoized iterable: it reads the shared cache by index and fills it from the source when needed.
 * It does not override `onReturn()`: stopping one consumer must not close the source shared with the others.
 */
class MemoizeIterator<T> extends BaseIterator<T> {
	private index = 0;

	constructor(private readonly source: Iterable<T>, private readonly cache: IMemoizeCache<T>, private readonly drainFirst: boolean) {
		super();
	}

	protected advance(): IteratorResult<T> {
		if (this.drainFirst)
			while (pull(this.source, this.cache));
		if (this.index < this.cache.values.length || pull(this.source, this.cache))
			return getContinueIteratorResult(this.cache.values[this.index++]);
		return getDoneIteratorResult();
	}
}
