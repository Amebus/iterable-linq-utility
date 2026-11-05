import { DeferredIterable, SourceIterator } from '../iterators';
import type { IShuffleOptions } from '../types';
import { getContinueIteratorResult, getDoneIteratorResult, isFunction, libraryError, mulberry32, Validations } from '../utils';

type Random<TSeed> = (seed: TSeed) => () => number;

/**
 * Lazily yields the values in uniform random order; the source is not changed. Without a seed every iteration gives a new
 * order, with `Math.random`; with a seed every iteration of the same source gives the same order. The order of a seed is a
 * promise: it changes only with a breaking change. `take(shuffle(iterable), k)` gives `k` random values.
 * The whole source is read before the first value is yielded, so `shuffle` does not end on an infinite source.
 * Every iteration reads the source again.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param options - `seed`: an integer that repeats the order, of which 32 bits are used, so `0` and `2 ** 32` give the same order
 * @returns a lazy, re-runnable `Iterable` of the values in random order
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, if `options` is not an object, or if `seed` is not an integer
 * @example
 * ```ts
 * Array.from(Functions.shuffle([1, 2, 3])); // for example [2, 3, 1]
 * Array.from(Functions.shuffle(Functions.range(5), { seed: 42 })); // the same order at every iteration
 * ```
 * @since next
 */
export function shuffle<T>(iterable: Iterable<T>, options?: Omit<IShuffleOptions, 'random'>): Iterable<T>;
/**
 * Lazily yields the values in random order, drawn from a generator you give; the source is not changed.
 * `random` is called with `seed` once per iteration, on the first `next()`, after the source is read, and returns the generator.
 * The generator is called once per value and returns a number from 0 up to, but not including, 1. A generator created from
 * the seed repeats the order at every iteration of the same source; `random` receives `undefined` without a seed.
 * The whole source is read before the first value is yielded, so `shuffle` does not end on an infinite source.
 * Every iteration reads the source again. The errors of `random` and of the generator propagate unchanged.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param options - `random`: `(seed) => () => number`; `seed`: a value of any type, passed to `random`
 * @returns a lazy, re-runnable `Iterable` of the values in random order
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, if `options` is not an object or `random`
 * is not a function; during the iteration, if `random` does not return a function or the generator returns anything else than
 * a number from 0 up to, but not including, 1
 * @example
 * ```ts
 * Array.from(Functions.shuffle([1, 2, 3], { seed: 'abc', random: seed => seedrandom(seed) }));
 * Array.from(Functions.shuffle([1, 2, 3], { random: () => Math.random }));
 * ```
 * @since next
 */
export function shuffle<T, TSeed>(iterable: Iterable<T>, options: IShuffleOptions<TSeed> & Required<Pick<IShuffleOptions<TSeed>, 'random'>>): Iterable<T>;
export function shuffle<T, TSeed>(iterable: Iterable<T>, options?: IShuffleOptions<TSeed>): Iterable<T> {
	Validations.throwIfNotIterable(iterable, 'iterable', 'shuffle');
	if (options !== undefined)
		Validations.throwIfNotObject(options, 'options', 'shuffle');
	const seed = options?.seed as TSeed;
	const given = options?.random;
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
		if (i >= values.length)
			return getDoneIteratorResult();
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
