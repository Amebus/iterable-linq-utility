import { iterableLinqBrand } from './iterableLinqBrand';
import { IterableLinqWrapper, toChain } from './linqIterable';
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
 * @param value - any value
 * @returns `true` if `value` is an `IIterableLinq` chain
 */
export function isIterableLinq(value: unknown): value is IIterableLinq<unknown> {
	return typeof value === 'object' && value !== null && (value as { [iterableLinqBrand]?: unknown })[iterableLinqBrand] === true;
}

/**
 * Defines a chain method. New methods are not writable; a replaced method keeps its original `writable` flag.
 */
function defineChainMethod(name: string, implementation: ChainMethod): void {
	const existing = Object.getOwnPropertyDescriptor(wrapperPrototype(), name);
	Object.defineProperty(wrapperPrototype(), name, {
		value: implementation,
		enumerable: false,
		writable: existing?.writable ?? false,
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
 * ```ts
 * declare module 'iterable-linq-utility' {
 * 	interface IIterableLinq<T> { chunk(size: number): IIterableLinq<T[]>; }
 * }
 * extend('chunk', function (size: number) { ... });
 * ```
 * @param name - the method name; it must not exist yet (library methods, earlier extensions, `Object.prototype` members)
 * @param implementation - the method; `this` is the chain, typed `IIterableLinq<unknown>`
 * @throws Error if `name` already exists (use `override` to replace it), is empty, or `implementation` is not a function
 */
export function extend<K extends Extract<keyof IIterableLinq<unknown>, string>>(name: K, implementation: ChainMethod): void {
	validateMethod(name, implementation);
	// check an instance, not only the prototype: instance fields would shadow the new method
	if (name in toChain([]))
		throw new Error(`"${name}" already exists on IIterableLinq: use override() to replace it`);
	defineChainMethod(name, implementation);
}

/**
 * Replaces an existing method of every chain: a library method or one added with `extend`.
 * Typical use: a library release adds a method with the same name as one of your extensions,
 * so `extend` throws at start-up; switch that call to `override` to keep your version.
 * Only the fluent method changes: `Functions` and the library internals keep the original behaviour.
 * @param name - an existing chain method; `constructor` and `Object.prototype` members are rejected
 * @param implementation - the new method; `this` is the chain, typed `IIterableLinq<unknown>`
 * @throws Error if `name` is not a chain method (use `extend` to add it), is empty, or `implementation` is not a function
 */
export function override<K extends Extract<keyof IIterableLinq<unknown>, string>>(name: K, implementation: ChainMethod): void {
	validateMethod(name, implementation);
	const key: string = name;
	const isChainMethod = key !== 'constructor' && Object.prototype.hasOwnProperty.call(wrapperPrototype(), key);
	if (!isChainMethod)
		throw new Error(`"${key}" is not a method of IIterableLinq: use extend() to add it`);
	defineChainMethod(key, implementation);
}
