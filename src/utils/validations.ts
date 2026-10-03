import { libraryError } from './libraryError';
import { isFunction } from './utils';

export function throwIfNotIterable<T>(sourceIterable: Iterable<T>, operation: string) {
	if (sourceIterable == null)
		throw libraryError(operation, 'The "sourceIterable" must be provided');
	if (!isFunction(sourceIterable[Symbol.iterator]))
		throw libraryError(operation, 'The provided "sourceIterable" does not conform to the iterator protocol https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterable_protocol. It must implement the "[Symbol.iterator]" function.');
}

export function throwIfNotFunction(value: unknown, name: string, operation: string) {
	if (!isFunction(value))
		throw libraryError(operation, `The "${name}" function must be provided`);
}

export function throwIfNotInteger(value: number, name: string, operation: string) {
	if (!Number.isInteger(value))
		throw libraryError(operation, `The "${name}" parameter must be an integer`);
}

export function throwIfNotNonNegativeInteger(value: number, name: string, operation: string) {
	if (!Number.isInteger(value) || value < 0)
		throw libraryError(operation, `The "${name}" parameter must be a non-negative integer`);
}

export function throwIfNotFiniteNonZero(value: number, name: string, operation: string) {
	if (!Number.isFinite(value) || value === 0)
		throw libraryError(operation, `The "${name}" parameter must be a finite number other than 0`);
}

export function throwIfNotObject(value: unknown, name: string, operation: string) {
	if (value === null || typeof value !== 'object')
		throw libraryError(operation, `The "${name}" parameter must be an object`);
}

export function throwIfNotNonEmptyString(value: unknown, name: string, operation: string) {
	if (typeof value !== 'string' || value.length === 0)
		throw libraryError(operation, `The "${name}" parameter must be a non-empty string`);
}
