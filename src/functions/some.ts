import { Predicate } from '../types';
import { Validations } from '../utils';

/**
 * Tells whether at least one value satisfies `predicate`; stops and closes the source at the first match.
 * @operation `Action`
 * @param iterable - the source `Iterable`
 * @param predicate - called with each value and its index
 * @returns `true` if a value satisfies `predicate`
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
