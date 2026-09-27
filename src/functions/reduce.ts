import { Reducer } from '../types';
import { Validations } from '../utils';

/**
 *
 * @operation `Action`
 * @param iterable
 * @param neutralElement
 * @param reducer
 * @returns
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
