import { isFunction } from './utils';

export function throwIfNotIterable<T>(sourceIterable: Iterable<T>) {
	if (sourceIterable == null)
		throw new Error('The "sourceIterable" must be provided');
	if (!isFunction(sourceIterable[Symbol.iterator]))
		throw new Error('The provided "sourceIterable" does not conform to the iterator protocol https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterable_protocol. It must implement the "[Symbol.iterator]" function.');
}

export function throwIfNotFunction(value: unknown, name: string) {
	if (!isFunction(value))
		throw new Error(`The "${name}" function must be provided`);
}

export function throwIfNegative(value: number, name: string) {
	if (value < 0)
		throw new Error(`The "${name}" parameter must be greater than or equal to 0`);
}

export function throwIfNotValidIterator<T, TR, TN>(sourceIterator: Iterator<T, TR, TN>) {
	if(!isFunction(sourceIterator.next))
		throw new Error('The proviced "sourceIterator" does not conform to the iterator protocol https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterable_protocol. It must implement the "next" function.');
}
