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

export function throwIfNotInteger(value: number, name: string) {
	if (!Number.isInteger(value))
		throw new Error(`The "${name}" parameter must be an integer`);
}

export function throwIfNotNonNegativeInteger(value: number, name: string) {
	if (!Number.isInteger(value) || value < 0)
		throw new Error(`The "${name}" parameter must be a non-negative integer`);
}

export function throwIfNotFiniteNonZero(value: number, name: string) {
	if (!Number.isFinite(value) || value === 0)
		throw new Error(`The "${name}" parameter must be a finite number other than 0`);
}

export function throwIfNotObject(value: unknown, name: string) {
	if (value === null || typeof value !== 'object')
		throw new Error(`The "${name}" parameter must be an object`);
}

export function throwIfNotNonEmptyString(value: unknown, name: string) {
	if (typeof value !== 'string' || value.length === 0)
		throw new Error(`The "${name}" parameter must be a non-empty string`);
}
