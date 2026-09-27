import { iterableLinqBrand } from './iterableLinqBrand';
import { IterableLinqWrapper } from './linqIterable';
import type { ChainMethod, IIterableLinq } from './types';
import { Validations } from './utils';

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

function defineChainMethod(name: string, implementation: ChainMethod): void {
	Object.defineProperty(wrapperPrototype(), name, {
		value: implementation,
		enumerable: false,
		writable: false,
		configurable: true
	});
}

function validateMethod(name: unknown, implementation: unknown): void {
	Validations.throwIfNotNonEmptyString(name, 'name');
	Validations.throwIfNotFunction(implementation, 'implementation');
}

/**
 * Adds a method to every chain, including the chains created before the call.
 * Declare the method first by augmenting `IIterableLinq`, then register it once, at application start-up:
 * @example
 * declare module 'iterable-linq-utility' {
 * 	interface IIterableLinq<T> { chunk(size: number): IIterableLinq<T[]>; }
 * }
 * extend('chunk', function (size: number) { ... });
 * @param name the method name; it must not exist yet (library methods, earlier extensions, `Object.prototype` members)
 * @param implementation the method; `this` is the chain, typed `IIterableLinq<unknown>`
 * @throws Error if `name` already exists (use `override` to replace it), is empty, or `implementation` is not a function
 */
export function extend<K extends keyof IIterableLinq<unknown>>(name: K, implementation: ChainMethod): void {
	validateMethod(name, implementation);
	if (name in wrapperPrototype())
		throw new Error(`"${String(name)}" already exists on IIterableLinq: use override() to replace it`);
	defineChainMethod(name as string, implementation);
}
