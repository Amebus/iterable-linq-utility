import { Reducer } from '../types';
import { libraryError, Validations } from '../utils';
import { collectToArray } from './collectToArray';

/**
 * Accumulates the values of `iterable` into a single result, from the last value to the first, starting from the last value.
 * The whole source is read before `reducer` is called.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param reducer - called with the accumulator, each value from the second-to-last one back to the first, and its index in the source; returns the new accumulator
 * @returns the final accumulator; the only value when `iterable` has one value, without calling `reducer`
 * @throws Error if `iterable` is missing, does not implement `[Symbol.iterator]` or is empty, or if `reducer` is not a function
 * @example
 * ```ts
 * Functions.reduceRight(['a', 'b', 'c'], (acc, v) => acc + v); // 'cba'
 * ```
 * @since next
 */
export function reduceRight<T>(iterable: Iterable<T>, reducer: Reducer<T, T>): T;
/**
 * Accumulates the values of `iterable` into a single result, from the last value to the first.
 * The whole source is read before `reducer` is called.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param neutralElement - the initial accumulator (the seed)
 * @param reducer - called with the accumulator, each value from the last one back to the first, and its index in the source; returns the new accumulator
 * @returns the final accumulator; `neutralElement` when `iterable` is empty
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `reducer` is not a function
 * @example
 * ```ts
 * Functions.reduceRight([1, 2, 3], '', (acc, v) => acc + v); // '321'
 * ```
 * @since next
 */
export function reduceRight<T, R>(iterable: Iterable<T>, neutralElement: R, reducer: Reducer<T, R>): R;
export function reduceRight<T, R>(iterable: Iterable<T>, ...args: [Reducer<T, T>] | [R, Reducer<T, R>]): T | R {
	Validations.throwIfNotIterable(iterable, 'reduceRight');
	// the number of arguments, not their type, picks the form: undefined and functions are valid seeds
	if (args.length === 1)
		return reduceRightWithoutSeed(iterable, args[0]);
	const [neutralElement, reducer] = args;
	Validations.throwIfNotFunction(reducer, 'reducer', 'reduceRight');

	// the index of a value needs the length of the source: the values are read into an array
	const values = collectToArray(iterable);
	let result = neutralElement;
	for (let index = values.length - 1; index >= 0; index--)
		result = reducer(result, values[index], index);
	return result;
}

function reduceRightWithoutSeed<T>(iterable: Iterable<T>, reducer: Reducer<T, T>): T {
	Validations.throwIfNotFunction(reducer, 'reducer', 'reduceRight');

	const values = collectToArray(iterable);
	if (values.length === 0)
		throw libraryError('reduceRight', 'The "sourceIterable" must not be empty when "reduceRight" has no seed');
	let result = values[values.length - 1];
	for (let index = values.length - 2; index >= 0; index--)
		result = reducer(result, values[index], index);
	return result;
}
