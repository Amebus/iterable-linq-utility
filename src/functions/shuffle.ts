import { DeferredIterable, SourceIterator } from '../iterators';
import type { IShuffleOptions } from '../types';
import { getContinueIteratorResult, getDoneIteratorResult, isFunction, libraryError, mulberry32, Validations } from '../utils';

type Random<TSeed> = (seed: TSeed) => () => number;

/**
 * Lazily yields the values in random order; the source is not changed. Without options every iteration gives a new order,
 * with `Math.random`. With `seed` every iteration of the same source gives the same order; that order is a promise, which
 * changes only with a breaking change. With `random` the numbers come from your generator: `random` is called with `seed`
 * once per iteration, on the first `next()`, after the source is read, and the order repeats only if it creates a new
 * generator from the seed at each call. `take(shuffle(iterable), k)` gives `k` random values.
 * The order is uniform as far as the generator allows: a `seed` has 32 bits, so from 13 values up it cannot reach every order.
 * Neither `Math.random` nor the `seed` is suitable for security; for that, give a stronger generator with `random`.
 * The whole source is read before the first value is yielded, so `shuffle` does not end on an infinite source.
 * Every iteration reads the source again. The errors of `random` and of the generator propagate unchanged.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param options - `seed`: without `random` an integer, of which 32 bits are used, so `0` and `2 ** 32` give the same order;
 * `random`: `(seed) => () => number`, with a `seed` of any type, or `undefined` without one
 * @returns a lazy, re-runnable `Iterable` of the values in random order
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, if `options` is not an object, if `random`
 * is not a function, or if `seed` is not an integer without `random`; during the iteration, if `random` does not return a
 * function or the generator returns anything else than a number from 0 up to, but not including, 1
 * @example
 * ```ts
 * Array.from(Functions.shuffle([1, 2, 3])); // for example [2, 3, 1]
 * Array.from(Functions.shuffle(Functions.range(10), { seed: 42 })); // [6, 5, 8, 7, 1, 3, 4, 2, 9, 0], at every iteration
 * Array.from(Functions.shuffle([1, 2, 3], { seed: 'abc', random: seed => seedrandom(seed) }));
 * Array.from(Functions.shuffle([1, 2, 3], { random: () => Math.random }));
 * ```
 * @since next
 */
export function shuffle<T, TSeed = undefined>(iterable: Iterable<T>, options?: IShuffleOptions<TSeed>): Iterable<T> {
	Validations.throwIfNotIterable(iterable, 'iterable', 'shuffle');
	if (options !== undefined)
		Validations.throwIfNotObject(options, 'options', 'shuffle');
	const seed = options?.seed as TSeed;
	const given = options?.random as Random<TSeed> | undefined;
	if (given !== undefined)
		Validations.throwIfNotFunction(given, 'random', 'shuffle');
	else if (seed !== undefined)
		Validations.throwIfNotInteger(seed as number, 'seed', 'shuffle');
	const random = given ?? (seed === undefined ? useMathRandom : mulberry32 as Random<unknown>);
	return new DeferredIterable(() => new ShuffleIterator(iterable, random, seed));
}

/** `Math.random` is read at each iteration, not when `shuffle` is called. */
function useMathRandom(): () => number {
	return Math.random;
}

class ShuffleIterator<T, TSeed> extends SourceIterator<T, T> {
	/** The values read from the source: the ones from `index` on are still to be chosen. */
	private values?: T[];
	private generator!: () => number;

	constructor(iterable: Iterable<T>, private readonly random: Random<TSeed>, private readonly seed: TSeed) {
		super(iterable);
	}

	protected advance(): IteratorResult<T> {
		const values = this.values ?? this.start();
		const i = this.index;
		if (i >= values.length) {
			this.values = undefined;
			return getDoneIteratorResult();
		}
		// the order of a seed is a promise: changing these lines is a breaking change
		const j = i + Math.floor(this.draw() * (values.length - i));
		const value = values[j];
		values[j] = values[i];
		this.index = i + 1;
		return getContinueIteratorResult(value);
	}

	protected override onReturn(value?: any): void {
		this.values = undefined;
		super.onReturn(value);
	}

	/** Reads the whole source, then creates the generator: an error of the source comes first, and does not close it. */
	private start(): T[] {
		const values: T[] = [];
		for (let n = this.source.next(); n.done !== true; n = this.source.next())
			values.push(n.value);
		this.generator = this.createGenerator();
		this.values = values;
		return values;
	}

	private createGenerator(): () => number {
		let generator: () => number;
		try {
			generator = this.random(this.seed);
		} catch (e) {
			this.closeAfterCallbackError();
			throw e;
		}
		if (!isFunction(generator)) {
			this.closeAfterCallbackError();
			throw libraryError('shuffle', 'The "random" function must return a function');
		}
		return generator;
	}

	private draw(): number {
		let r: number;
		try {
			r = this.generator();
		} catch (e) {
			this.closeAfterCallbackError();
			throw e;
		}
		if (typeof r !== 'number' || !(r >= 0 && r < 1)) {
			this.closeAfterCallbackError();
			throw libraryError('shuffle', 'The generator of "random" must return a number from 0 up to, but not including, 1');
		}
		return r;
	}
}
