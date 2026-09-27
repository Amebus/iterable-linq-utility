import { Validations } from './utils';
import { IterableLinqWrapper, type IIterableLinq } from './linqIterable';

import * as Functions from './functions';

/**
 * Starts a chain with no values.
 * @example
 * IterableLinq.empty<number>().collectToArray(); // []
 */
export function empty<T>(): IIterableLinq<T> {
	return from(Functions.empty());
}

/**
 * Starts a chain over any `Iterable` (array, string, Set, Map, generator…). The source is not copied.
 * @param iterable the source of the chain
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`
 * @example
 * IterableLinq.from([1, 2, 3]).map(v => v * 2).collectToArray(); // [2, 4, 6]
 */
export function from<T>(iterable: Iterable<T>): IIterableLinq<T> {
	Validations.throwIfNotIterable(iterable);
	return new IterableLinqWrapper(iterable);
}

/**
 * Starts a chain of numbers from `start` (default 0) up to, but not including, `end`.
 * - `step` defaults to 1 (or -1 when `end < start`); its sign is adjusted to the direction.
 * - `reverse` yields the same numbers in reverse order.
 * - Values are computed as `start + index * step`, so decimal steps do not accumulate rounding errors.
 * - A `NaN` bound or step gives an empty chain.
 * @example
 * IterableLinq.fromRange(3).collectToArray();          // [0, 1, 2]
 * IterableLinq.fromRange(1, 7, 2).collectToArray();    // [1, 3, 5]
 * IterableLinq.fromRange(0, 3, true).collectToArray(); // [2, 1, 0]
 */
export function fromRange(end: number): IIterableLinq<number>;
export function fromRange(end: number, reverse?: boolean): IIterableLinq<number>;
export function fromRange(start: number, end: number): IIterableLinq<number>;
export function fromRange(start: number, end: number, step: number): IIterableLinq<number>;
export function fromRange(start: number, end: number, reverse: boolean): IIterableLinq<number>;
export function fromRange(start: number, end: number, step: number, reverse: boolean): IIterableLinq<number>;
export function fromRange(start: number, end?: number | boolean, step?: number | boolean, reverse?: boolean): IIterableLinq<number>;
export function fromRange(start: number, end?: number | boolean, step?: number | boolean, reverse?: boolean): IIterableLinq<number> {
	return from(Functions.range(start, end, step, reverse));
}

/**
 * Starts a chain that yields `value` `count` times.
 * @param value the value to repeat
 * @param count how many times; must be a non-negative integer
 * @throws Error if `count` is negative, not an integer, `NaN` or `Infinity`
 * @example
 * IterableLinq.repeat(5, 3).collectToArray(); // [5, 5, 5]
 */
export function repeat<T>(value: T, count: number): IIterableLinq<T> {
	return from(Functions.repeat(value, count));
}

export {
	Functions,
	IIterableLinq, IterableLinqWrapper,
};

export * from './types';
