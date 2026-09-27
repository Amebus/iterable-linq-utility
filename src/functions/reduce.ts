import { Reducer } from '../types';
import { Validations } from '../utils';

/**
 * Accumulates the values of `iterable` into a single result.
 * @operation `Action`
 * @param iterable the source `Iterable`
 * @param neutralElement the initial accumulator (the seed)
 * @param reducer called with the accumulator, each value and its index; returns the new accumulator
 * @returns the final accumulator; `neutralElement` when `iterable` is empty
 */
export function reduce<T, R>(iterable: Iterable<T>, neutralElement: R, reducer: Reducer<T, R>): R {
	Validations.throwIfNotIterable(iterable);
	Validations.throwIfNotFunction(reducer, 'reducer');

	let result = neutralElement;
	let index = 0;
	// for…of closes the source if the reducer throws
	for (const value of iterable)
		result = reducer(result, value, index++);
	return result;
}
