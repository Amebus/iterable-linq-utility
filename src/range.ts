import { getDoneIteratorResult, getIteratorResult } from "./iteratorResults";

export function range(end: number): Iterable<number>;
export function range(end: number, reverse?: boolean): Iterable<number>;
export function range(start: number, end: number): Iterable<number>;
export function range(start: number, end: number, step: number): Iterable<number>;
export function range(start: number, end: number, reverse: boolean): Iterable<number>;
export function range(start: number, end: number, step: number, reverse: boolean): Iterable<number>;
export function range(start: number, end?: number | boolean, step?: number | boolean, reverse?: boolean): Iterable<number> {
	const choosenEnd = end == null || end === true || end === false ? start : end;
	const choosenStart = end == null || end === true || end === false ? 0 : start;
	
	const isStartBeforeEnd = choosenStart < choosenEnd;

	const tempStep = step !== true && step !== false && step != null && step !== 0 ? step : isStartBeforeEnd ? 1 : -1;
	const choosenStep = isStartBeforeEnd && tempStep < 0 ? -1 * tempStep : !isStartBeforeEnd && tempStep > 0 ? -1 * tempStep : tempStep;
	// const choosenStep = tempStep;

	const choosenLength = Math.ceil(Math.abs(choosenEnd - choosenStart) / Math.abs(choosenStep));
	const shouldReverse = end === true || step === true || (reverse != null && reverse) ? true : false;
	const initialValue = shouldReverse ? choosenLength * choosenStep + choosenStart : choosenStart;
	if (choosenStart === choosenEnd)
		return new RangeEmptyIterable(initialValue, 0, 0);
	if (shouldReverse) {
		return new RangeRverseIterable(initialValue, choosenLength, choosenStep);
		// return function*() {
		// 	const internalStep = choosenStep;
		// 	let length = choosenLength;
		// 	let value = initialValue;
		// 	while(length--) {
		// 		yield value;
		// 		value -= internalStep;
		// 	}
		// }();
	}
	return new RangeIterable(initialValue, choosenLength, choosenStep);
	// return function*() {
	// 	const internalStep = choosenStep;
	// 	let length = choosenLength;
	// 	let value = initialValue;
	// 	while(length--) {
	// 		yield value;
	// 		value += internalStep;
	// 	}
	// }();
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

	initialValue: number;
	length: number;
	step: number;

}

class RangeIterator implements Iterator<number>{

	constructor(value: number, length: number, step: number) {
		this.value = value;
		this.length = length;
		this.step = step;
	}

	value: number;
	length: number;
	step: number;

	next(): IteratorResult<number, any> {
		const value = this.value;
		this.value += this.step;
    if (this.length--) 
			return getIteratorResult(false, value);
		return getDoneIteratorResult();
	}
}


class RangeRverseIterable implements Iterable<number> {
	
	constructor(initialValue: number, length: number, step: number) {
		this.initialValue = initialValue - step;
		this.length = length;
		this.step = step;
	}

	[Symbol.iterator](): Iterator<number, any, undefined> {
		return new RangeReverseIterator(this.initialValue, this.length, this.step);
	}

	initialValue: number;
	length: number;
	step: number;

}

class RangeReverseIterator implements Iterator<number>{

	constructor(value: number, length: number, step: number) {
		this.value = value;
		this.length = length;
		this.step = step;
	}

	value: number;
	length: number;
	step: number;

	next(): IteratorResult<number, any> {
		const value = this.value;
		this.value -= this.step;
    if (this.length--) 
			return getIteratorResult(false, value);
		return getDoneIteratorResult();
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

  initialValue: number;
  length: number;
  step: number;
}

class RangeEmptyIterator implements Iterator<number> {
  constructor(value: number, length: number, step: number) {
    this.value = value;
    this.length = length;
    this.step = step;
  }

  value: number;
  length: number;
  step: number;

  next(): IteratorResult<number, any> {
    return getDoneIteratorResult();
  }
}
