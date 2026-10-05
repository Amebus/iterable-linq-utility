import { libraryError, Validations } from './utils';
import { toChain } from './linqIterable';

import * as Functions from './functions';
import type { IIterableLinq, IObjectDefaultOptions, IObjectOptions, IRangeOptions, ObjectItem } from './types';

/**
 * Starts a chain with no values.
 * @returns an empty chain
 * @example
 * ```ts
 * IterableLinq.empty<number>().collectToArray(); // []
 * ```
 * @since 0.0.10
 */
export function empty<T>(): IIterableLinq<T> {
	return from(Functions.empty());
}

/**
 * Starts a chain over any `Iterable` (array, string, Set, Map, generator…). The source is not copied.
 * @param iterable - the source of the chain
 * @returns a chain over `iterable`; each run of the chain iterates `iterable` again
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`
 * @example
 * ```ts
 * IterableLinq.from([1, 2, 3]).map(v => v * 2).collectToArray(); // [2, 4, 6]
 * IterableLinq.from('abc').collectToArray(); // ['a', 'b', 'c']
 * ```
 * @since 0.0.1
 */
export function from<T>(iterable: Iterable<T>): IIterableLinq<T> {
	Validations.throwIfNotIterable(iterable, 'from');
	return toChain(iterable);
}

/**
 * Starts a chain over the properties of `object`: its entries, its keys, its values or its property descriptors.
 * With the default options it yields what `Object.entries` returns: the own, enumerable, string keys.
 * - `options.yield`: `'entries'` (default) `[key, value]`, `'keys'`, `'values'`, or `'descriptors'` `[key, descriptor, owner]` without calling the getters.
 * - `options.inherited` also reads the prototype chain, up to `Object.prototype` excluded; a key is yielded once, from the nearest object that has it, like `for…in`.
 * - `options.nonEnumerable` also reads the non-enumerable properties, `options.symbols` the symbol keys.
 * - Each run of the chain reads the object again: the keys of an object when the iteration reaches it, a value when it is yielded.
 * @param object - the object to read
 * @param options - `yield`, `inherited`, `nonEnumerable` and `symbols`
 * @returns a chain of the properties of `object`
 * @throws Error if `object` is not an object or a function, `options` is not an object, `yield` is not one of its values, or a flag is not a boolean
 * @example
 * ```ts
 * IterableLinq.fromObject({ a: 1, b: 2 }).collectToArray();                    // [['a', 1], ['b', 2]]
 * IterableLinq.fromObject({ a: 1, b: 2 }, { yield: 'keys' }).collectToArray();   // ['a', 'b']
 * IterableLinq.fromObject({ a: 1, b: 2 }, { yield: 'values' }).collectToArray(); // [1, 2]
 * ```
 * @since 0.11.0
 */
export function fromObject<O extends object, const Options extends IObjectOptions = IObjectDefaultOptions>(object: O, options?: Options): IIterableLinq<ObjectItem<O, Options>> {
	return from(Functions.fromObject(object, options));
}

/**
 * Starts a chain of numbers from 0 up to, but not including, `end`.
 * - `options.step` is the distance between two values (default 1); its sign is ignored, the direction comes from the sign of `end`.
 * - `options.reverse` yields the same numbers in reverse order.
 * - Values are computed as `index * step`, so decimal steps do not accumulate rounding errors.
 * - A `NaN` bound gives an empty chain.
 * @param end - the bound, not included
 * @param options - `step` and `reverse`
 * @returns a chain of numbers
 * @throws Error if `options` is not an object, or if `step` is 0, `NaN` or infinite
 * @example
 * ```ts
 * IterableLinq.fromRange(3).collectToArray();                       // [0, 1, 2]
 * IterableLinq.fromRange(3, { reverse: true }).collectToArray();    // [2, 1, 0]
 * IterableLinq.fromRange(-3).collectToArray();                      // [0, -1, -2]
 * ```
 * @since 0.0.10
 */
export function fromRange(end: number, options?: IRangeOptions): IIterableLinq<number>;
/**
 * Starts a chain of numbers from `start` up to, but not including, `end`.
 * - `options.step` is the distance between two values (default 1); its sign is ignored, the direction comes from `start` and `end`.
 * - `options.reverse` yields the same numbers in reverse order.
 * - Values are computed as `start + index * step`, so decimal steps do not accumulate rounding errors.
 * - A `NaN` bound gives an empty chain.
 * @param start - the first value
 * @param end - the bound, not included
 * @param options - `step` and `reverse`
 * @returns a chain of numbers
 * @throws Error if `options` is not an object, or if `step` is 0, `NaN` or infinite
 * @example
 * ```ts
 * IterableLinq.fromRange(1, 7, { step: 2 }).collectToArray();       // [1, 3, 5]
 * IterableLinq.fromRange(5, 0).collectToArray();                    // [5, 4, 3, 2, 1]
 * IterableLinq.fromRange(0, 1, { step: 0.25 }).collectToArray();    // [0, 0.25, 0.5, 0.75]
 * ```
 * @since 0.0.10
 */
export function fromRange(start: number, end: number, options?: IRangeOptions): IIterableLinq<number>;
export function fromRange(startOrEnd: number, endOrOptions?: number | IRangeOptions, options?: IRangeOptions): IIterableLinq<number> {
	if (typeof endOrOptions === 'number')
		return from(Functions.range(startOrEnd, endOrOptions, options));
	if (options !== undefined)
		throw libraryError('fromRange', 'The "options" parameter must be the second argument when "start" is omitted');
	return from(Functions.range(startOrEnd, endOrOptions));
}

/**
 * Starts a chain that yields `value` `count` times.
 * @param value - the value to repeat
 * @param count - how many times; must be a non-negative integer
 * @returns a chain of `count` values
 * @throws Error if `count` is negative, not an integer, `NaN` or `Infinity`
 * @example
 * ```ts
 * IterableLinq.repeat(5, 3).collectToArray(); // [5, 5, 5]
 * ```
 * @since 0.0.10
 */
export function repeat<T>(value: T, count: number): IIterableLinq<T> {
	return from(Functions.repeat(value, count));
}

// the operations as plain functions over any Iterable (since 0.0.10); the bundled .d.ts drops JSDoc placed here
export { Functions };

export { extend, isIterableLinq, override } from './extension';

export * from './types';
