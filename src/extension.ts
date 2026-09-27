import { iterableLinqBrand } from './iterableLinqBrand';
import { IterableLinqWrapper } from './linqIterable';
import type { IIterableLinq } from './types';

/**
 * The prototype shared by every chain.
 */
export function wrapperPrototype(): object {
	return IterableLinqWrapper.prototype;
}

/**
 * Tells whether `value` is a chain created by this library.
 * It checks a `Symbol.for` brand instead of `instanceof`, so it also works when two copies of the library are loaded.
 * @param value any value
 * @returns `true` if `value` is an `IIterableLinq` chain
 */
export function isIterableLinq(value: unknown): value is IIterableLinq<unknown> {
	return typeof value === 'object' && value !== null && (value as { [iterableLinqBrand]?: unknown })[iterableLinqBrand] === true;
}
