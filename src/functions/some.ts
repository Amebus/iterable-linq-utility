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
	const iterator: Iterator<T> = iterable[Symbol.iterator]();
	let i = 0;

	for (let n = iterator.next(); n.done !== true; n = iterator.next()) {
		if (predicate(n.value, i++)) {
			iterator.return?.();
			return true;
		}
	}
	return false;
}
