import { BaseIterator, DeferredIterable } from '../iterators';
import { getContinueIteratorResult, getDoneIteratorResult, Validations } from '../utils';
import { empty } from './empty';

/**
 * Options of `range`.
 */
export interface IRangeOptions {
	/** Distance between two values; defaults to 1. Only its absolute value is used: the direction comes from `start` and `end`. */
	step?: number;
	/** Yields the same values in reverse order; defaults to `false`. */
	reverse?: boolean;
}

/**
 * Returns the numbers from `start` (default 0) up to, but not including, `end`, computed as `start + index * step`.
 * The direction follows `start` and `end`; `reverse` yields the same numbers backwards; a `NaN` bound gives an empty `Iterable`.
 * @operation `Transformation`
 * @throws Error if `options` is not an object, or `step` is 0, `NaN` or infinite
 * @returns a lazy, re-runnable `Iterable` of numbers
 */
export function range(end: number, options?: IRangeOptions): Iterable<number>;
export function range(start: number, end: number, options?: IRangeOptions): Iterable<number>;
export function range(startOrEnd: number, endOrOptions?: number | IRangeOptions, options?: IRangeOptions): Iterable<number>;
export function range(startOrEnd: number, endOrOptions?: number | IRangeOptions, options?: IRangeOptions): Iterable<number> {
	const hasStart = typeof endOrOptions === 'number';
	const start = hasStart ? startOrEnd : 0;
	const end = hasStart ? endOrOptions : startOrEnd;
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
