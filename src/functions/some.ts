import { Predicate } from '../types';
import { Validations } from '../utils';

/**
 *
 * @operation `Action`
 * @param iterable
 * @param predicate
 * @returns
 */
export function some<T>(iterable: Iterable<T>, predicate: Predicate<T>): boolean {
	Validations.throwIfNotIterable(iterable);
	Validations.throwIfNotFunction(predicate, 'predicate');
	let index = 0;
	// for…of closes the source both when we return early and when the predicate throws
	for (const value of iterable) {
		if (predicate(value, index++))
			return true;
	}
	return false;
}
