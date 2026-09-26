import { BaseIterator, DeferredIterable } from '../iterators';
import { getContinueIteratorResult, getDoneIteratorResult } from '../utils';
import { empty } from './empty';

export function range(end: number): Iterable<number>;
export function range(end: number, reverse?: boolean): Iterable<number>;
export function range(start: number, end: number): Iterable<number>;
export function range(start: number, end: number, step: number): Iterable<number>;
export function range(start: number, end: number, reverse: boolean): Iterable<number>;
export function range(start: number, end: number, step: number, reverse: boolean): Iterable<number>;
export function range(start: number, end?: number | boolean, step?: number | boolean, reverse?: boolean): Iterable<number>;
export function range(start: number, end?: number | boolean, step?: number | boolean, reverse?: boolean): Iterable<number> {
	const chosenEnd = end == null || end === true || end === false ? start : end;
	const chosenStart = end == null || end === true || end === false ? 0 : start;

	const isStartBeforeEnd = chosenStart < chosenEnd;

	const tempStep = step !== true && step !== false && step != null && step !== 0 ? step : isStartBeforeEnd ? 1 : -1;
	const chosenStep = isStartBeforeEnd && tempStep < 0 ? -1 * tempStep : !isStartBeforeEnd && tempStep > 0 ? -1 * tempStep : tempStep;

	const chosenLength = Math.ceil(Math.abs(chosenEnd - chosenStart) / Math.abs(chosenStep));
	const shouldReverse = end === true || step === true || (reverse != null && reverse) ? true : false;
	// NaN bounds or steps give a NaN length: treat them as an empty range
	if (!(chosenLength > 0))
		return empty();
	const first = shouldReverse ? chosenStart + (chosenLength - 1) * chosenStep : chosenStart;
	const signedStep = shouldReverse ? -chosenStep : chosenStep;
	return new DeferredIterable(() => new RangeIterator(first, signedStep, chosenLength));
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
