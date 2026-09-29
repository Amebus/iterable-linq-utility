import { Reducer } from '../types';
import { Validations } from '../utils';

/**
 * Accumulates the values of `iterable` into a single result, starting from the first value.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param reducer - called with the accumulator, each value from the second one and its index (starting at 1); returns the new accumulator
 * @returns the final accumulator; the only value when `iterable` has one value, without calling `reducer`
 * @throws Error if `iterable` is missing, does not implement `[Symbol.iterator]` or is empty, or if `reducer` is not a function
 * @example
 * ```ts
 * Functions.reduce([3, 7, 2], (acc, v) => (v > acc ? v : acc)); // 7
 * ```
 * @since 0.2.0
 */
export function reduce<T>(iterable: Iterable<T>, reducer: Reducer<T, T>): T;
/**
 * Accumulates the values of `iterable` into a single result.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param neutralElement - the initial accumulator (the seed)
 * @param reducer - called with the accumulator, each value and its index; returns the new accumulator
 * @returns the final accumulator; `neutralElement` when `iterable` is empty
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `reducer` is not a function
 * @example
 * ```ts
 * Functions.reduce([1, 2, 3], 0, (acc, v) => acc + v); // 6
 * ```
 * @since 0.0.10
 */
export function reduce<T, R>(iterable: Iterable<T>, neutralElement: R, reducer: Reducer<T, R>): R;
export function reduce<T, R>(iterable: Iterable<T>, ...args: [Reducer<T, T>] | [R, Reducer<T, R>]): T | R {
	Validations.throwIfNotIterable(iterable);
	// the number of arguments, not their type, picks the form: undefined and functions are valid seeds
	if (args.length === 1)
		return reduceWithoutSeed(iterable, args[0]);
	const [neutralElement, reducer] = args;
	Validations.throwIfNotFunction(reducer, 'reducer');

	let result = neutralElement;
	let index = 0;
	// for…of closes the source if the reducer throws
	for (const value of iterable)
		result = reducer(result, value, index++);
	return result;
}

function reduceWithoutSeed<T>(iterable: Iterable<T>, reducer: Reducer<T, T>): T {
	Validations.throwIfNotFunction(reducer, 'reducer');

	let result: T | undefined;
	let index = 0;
	// for…of closes the source if the reducer throws
	for (const value of iterable) {
		result = index === 0 ? value : reducer(result as T, value, index);
		index++;
	}
	if (index === 0)
		throw new Error('The "sourceIterable" must not be empty when "reduce" has no seed');
	return result as T;
}
