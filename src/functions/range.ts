import { BaseIterator, DeferredIterable } from '../iterators';
import { getContinueIteratorResult, getDoneIteratorResult, Validations } from '../utils';
import type { IRangeOptions } from '../types';
import { empty } from './empty';

/**
 * Returns the numbers from 0 up to, but not including, `end`, computed as `index * step`.
 * The direction follows the sign of `end`; `reverse` yields the same numbers backwards; a `NaN` bound gives an empty `Iterable`.
 * @operation `Transformation`
 * @param end - the bound, not included
 * @param options - `step` (default 1, sign ignored) and `reverse` (default `false`)
 * @returns a lazy, re-runnable `Iterable` of numbers
 * @throws Error if `options` is not an object, or if `step` is 0, `NaN` or infinite
 * @example
 * ```ts
 * Array.from(Functions.range(3)); // [0, 1, 2]
 * Array.from(Functions.range(3, { reverse: true })); // [2, 1, 0]
 * ```
 * @since 0.0.10
 */
export function range(end: number, options?: IRangeOptions): Iterable<number>;
/**
 * Returns the numbers from `start` up to, but not including, `end`, computed as `start + index * step`.
 * The direction follows `start` and `end`; `reverse` yields the same numbers backwards; a `NaN` bound gives an empty `Iterable`.
 * @operation `Transformation`
 * @param start - the first value
 * @param end - the bound, not included
 * @param options - `step` (default 1, sign ignored) and `reverse` (default `false`)
 * @returns a lazy, re-runnable `Iterable` of numbers
 * @throws Error if `options` is not an object, or if `step` is 0, `NaN` or infinite
 * @example
 * ```ts
 * Array.from(Functions.range(1, 7, { step: 2 })); // [1, 3, 5]
 * Array.from(Functions.range(5, 0)); // [5, 4, 3, 2, 1]
 * ```
 * @since 0.0.10
 */
export function range(start: number, end: number, options?: IRangeOptions): Iterable<number>;
export function range(startOrEnd: number, endOrOptions?: number | IRangeOptions, options?: IRangeOptions): Iterable<number> {
	const hasStart = typeof endOrOptions === 'number';
	const start = hasStart ? startOrEnd : 0;
	const end = hasStart ? endOrOptions : startOrEnd;
	if (!hasStart && options !== undefined)
		throw new Error('The "options" parameter must be the second argument when "start" is omitted');
	const rangeOptions = hasStart ? options : endOrOptions;
	if (rangeOptions !== undefined)
		Validations.throwIfNotObject(rangeOptions, 'options');
	const { step = 1, reverse = false } = rangeOptions ?? {};
	Validations.throwIfNotFiniteNonZero(step, 'step');

	const normalized = normalizeRange(start, end, Math.abs(step), reverse);
	// a NaN bound gives a NaN length: treat it as an empty range
	if (!(normalized.length > 0))
		return empty();
	return new DeferredIterable(() => new RangeIterator(normalized.first, normalized.step, normalized.length));
}

interface INormalizedRange {
	readonly first: number;
	readonly step: number;
	readonly length: number;
}

/**
 * Turns the user-facing bounds into the first value, the signed step and the number of values.
 */
function normalizeRange(start: number, end: number, distance: number, reverse: boolean): INormalizedRange {
	const step = end < start ? -distance : distance;
	const length = Math.ceil(Math.abs(end - start) / distance);
	if (!reverse)
		return { first: start, step, length };
	return { first: start + (length - 1) * step, step: -step, length };
}

class RangeIterator extends BaseIterator<number> {
	private index = 0;

	constructor(private readonly first: number, private readonly step: number, private readonly length: number) {
		super();
	}

	protected advance(): IteratorResult<number> {
		if (this.index >= this.length)
			return getDoneIteratorResult();
		return getContinueIteratorResult(this.first + this.index++ * this.step);
	}
}
