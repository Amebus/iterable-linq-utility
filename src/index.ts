import { Validations } from './utils';
import { IterableLinqWrapper, type IIterableLinq } from './linqIterable';

import * as Functions from './functions';
import type { IRangeOptions } from './functions';

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
 * - `options.step` is the distance between two values (default 1); its sign is ignored, the direction comes from `start` and `end`.
 * - `options.reverse` yields the same numbers in reverse order.
 * - Values are computed as `start + index * step`, so decimal steps do not accumulate rounding errors.
 * - A `NaN` bound gives an empty chain.
 * @throws Error if `options` is not an object, or `step` is 0, `NaN` or infinite
 * @example
 * IterableLinq.fromRange(3).collectToArray();                       // [0, 1, 2]
 * IterableLinq.fromRange(1, 7, { step: 2 }).collectToArray();       // [1, 3, 5]
 * IterableLinq.fromRange(3, { reverse: true }).collectToArray();    // [2, 1, 0]
 * IterableLinq.fromRange(5, 0).collectToArray();                    // [5, 4, 3, 2, 1]
 */
export function fromRange(end: number, options?: IRangeOptions): IIterableLinq<number>;
export function fromRange(start: number, end: number, options?: IRangeOptions): IIterableLinq<number>;
export function fromRange(startOrEnd: number, endOrOptions?: number | IRangeOptions, options?: IRangeOptions): IIterableLinq<number>;
export function fromRange(startOrEnd: number, endOrOptions?: number | IRangeOptions, options?: IRangeOptions): IIterableLinq<number> {
	return from(Functions.range(startOrEnd, endOrOptions, options));
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
	type IRangeOptions,
};

export * from './types';
