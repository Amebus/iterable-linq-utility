import { BaseIterator } from '../iterators';
import type { IMemoizeOptions } from '../types';
import { getContinueIteratorResult, getDoneIteratorResult, Validations } from '../utils';

export function getMemoizeDefaultOptions(): IMemoizeOptions {
	return {
		allowPartialMemoization: true
	};
}

/**
 * Caches the values of `iterable` the first time they are read, so later iterations do not re-run the source.
 * With partial memoization, a consumer that stops early keeps the shared source open until another consumer finishes it.
 * If the source throws, every later read past the cached values throws the same error.
 * @operation `Transformation`
 * @param iterable the source `Iterable`
 * @param options `allowPartialMemoization: false` reads the whole source on the first read
 * @returns a lazy `Iterable` backed by the cache
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
	/** Error thrown by the source: every later read past the cached values throws it again. */
	error?: { readonly value: unknown };
}

function createCache<T>(): IMemoizeCache<T> {
	return { values: [], finished: false };
}

/**
 * Reads one more value from the source into the cache.
 * @returns false when the source is exhausted
 */
function pull<T>(iterable: Iterable<T>, cache: IMemoizeCache<T>): boolean {
	if (cache.error)
		throw cache.error.value;
	if (cache.finished)
		return false;
	cache.source ??= iterable[Symbol.iterator]();
	let n: IteratorResult<T>;
	try {
		n = cache.source.next();
	} catch (error) {
		cache.error = { value: error };
		cache.source = undefined;
		throw error;
	}
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
