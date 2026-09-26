import { getDoneIteratorResult, getContinueIteratorResult } from '../utils';

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
	const initialValue = shouldReverse ? chosenLength * chosenStep + chosenStart : chosenStart;
	if (chosenStart === chosenEnd)
		return new RangeEmptyIterable(initialValue, 0, 0);
	if (shouldReverse) {
		return new RangeReverseIterable(initialValue, chosenLength, chosenStep);
	}
	return new RangeIterable(initialValue, chosenLength, chosenStep);
}
class RangeIterable implements Iterable<number> {

	constructor(initialValue: number, length: number, step: number) {
		this.initialValue = initialValue;
		this.length = length;
		this.step = step;
	}

	[Symbol.iterator](): Iterator<number, any, undefined> {
		return new RangeIterator(this.initialValue, this.length, this.step);
	}

	private readonly initialValue: number;
	private readonly length: number;
	private readonly step: number;

}

class RangeIterator implements Iterator<number>{

	constructor(value: number, length: number, step: number) {
		this.value = value;
		this.length = length;
		this.step = step;
	}

	private value: number;
	private length: number;
	private readonly step: number;

	internalNext: () => IteratorResult<number, any> = () => {
		const value = this.value;
		this.value += this.step;
		if (this.length--)
			return getContinueIteratorResult(value);
		return getDoneIteratorResult();
	};

	next(): IteratorResult<number, any> {
		return this.internalNext();
	}

	return(value?: any): IteratorResult<number, any> {
		this.internalNext = getDoneIteratorResult;
		return getDoneIteratorResult(value);
	}
}

class RangeReverseIterable implements Iterable<number> {

	constructor(initialValue: number, length: number, step: number) {
		this.initialValue = initialValue - step;
		this.length = length;
		this.step = step;
	}

	[Symbol.iterator](): Iterator<number, any, undefined> {
		return new RangeReverseIterator(this.initialValue, this.length, this.step);
	}

	private readonly initialValue: number;
	private readonly length: number;
	private readonly step: number;

}

class RangeReverseIterator implements Iterator<number>{

	constructor(value: number, length: number, step: number) {
		this.value = value;
		this.length = length;
		this.step = step;
	}

	private value: number;
	private length: number;
	private readonly step: number;
	internalNext: () => IteratorResult<number, any> = () => {
		const value = this.value;
		this.value -= this.step;
		if (this.length--)
			return getContinueIteratorResult(value);
		return getDoneIteratorResult();
	};

	next(): IteratorResult<number, any> {
		return this.internalNext();
	}

	return(value?: any): IteratorResult<number, any> {
		this.internalNext = getDoneIteratorResult;
		return getDoneIteratorResult(value);
	}
}

class RangeEmptyIterable implements Iterable<number> {
	constructor(initialValue: number, length: number, step: number) {
		this.initialValue = initialValue;
		this.length = length;
		this.step = step;
	}

	[Symbol.iterator](): Iterator<number, any, undefined> {
		return new RangeEmptyIterator(this.initialValue, this.length, this.step);
	}

	private readonly initialValue: number;
	private readonly length: number;
	private readonly step: number;
}

class RangeEmptyIterator implements Iterator<number> {
	constructor(value: number, length: number, step: number) {
		this.value = value;
		this.length = length;
		this.step = step;
	}

	private value: number;
	private length: number;
	private readonly step: number;

	next(): IteratorResult<number, any> {
		return getDoneIteratorResult();
	}

	return(value?: any): IteratorResult<number, any> {
		return getDoneIteratorResult(value);
	}
}
