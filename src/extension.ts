import { iterableLinqBrand } from './iterableLinqBrand';
import { IterableLinqWrapper, toChain } from './linqIterable';
import type { ChainMethod, IIterableLinq } from './types';
import { libraryError, Validations } from './utils';

/**
 * The prototype shared by every chain.
 */
export function wrapperPrototype(): object {
	return IterableLinqWrapper.prototype;
}

/**
 * Tells whether `value` is a chain created by this library.
 * It checks a `Symbol.for` brand instead of `instanceof`, so it also works when two copies of the library are loaded.
 * It is a brand check, not a validation: do not use it to decide whether untrusted input is safe to call.
 * @param value - any value
 * @returns `true` if `value` is an `IIterableLinq` chain
 * @example
 * ```ts
 * isIterableLinq(IterableLinq.from([1, 2, 3])); // true
 * isIterableLinq([1, 2, 3]); // false
 * ```
 * @since 0.1.0
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

/**
 * The names added by `extend`: a later `extend` of one of them replaces it, a library method still throws.
 */
const extensions = new Set<string>();

function validateMethod(operation: string, name: unknown, implementation: unknown): void {
	Validations.throwIfNotNonEmptyString(name, 'name', operation);
	Validations.throwIfNotFunction(implementation, 'implementation', operation);
}

/**
 * Adds a method to every chain, including the chains created before the call.
 * Declare the method first by augmenting `IIterableLinq`, then register it at application start-up.
 * Registering a name added by an earlier `extend` again replaces its implementation, so a module that runs twice
 * (hot module replacement, a test runner that re-imports it) does not throw: the last registration wins.
 * @param name - the method name; a new name or one added by an earlier `extend`, not a library method or an `Object.prototype` member
 * @param implementation - the method; `this` is the chain, typed `IIterableLinq<unknown>`
 * @throws Error if `name` is a library method (use `override` to replace it), an `Object.prototype` member or a name used by the chain instances, is empty, or `implementation` is not a function
 * @example
 * ```ts
 * declare module 'iterable-linq-utility' {
 * 	interface IIterableLinq<T> { chunk(size: number): IIterableLinq<T[]>; }
 * }
 * extend('chunk', function (size: number) {
 * 	// `this` is the chain the method is called on; chunks() is your generator function
 * 	return IterableLinq.from({ [Symbol.iterator]: () => chunks(this, size) });
 * });
 * IterableLinq.from([1, 2, 3]).chunk(2).collectToArray(); // [[1, 2], [3]]
 * ```
 * @since 0.1.0
 */
export function extend<K extends Extract<keyof IIterableLinq<unknown>, string>>(name: K, implementation: ChainMethod): void {
	validateMethod('extend', name, implementation);
	// check an instance, not only the prototype: instance fields would shadow the new method
	if (!extensions.has(name) && name in toChain([]))
		throw libraryError('extend', `"${name}" already exists on IIterableLinq: use override() to replace it`);
	defineChainMethod(name, implementation);
	extensions.add(name);
}

/**
 * Replaces an existing method of every chain: a library method or one added with `extend`.
 * Typical use: a library release adds a method with the same name as one of your extensions,
 * so `extend` throws at start-up; switch that call to `override` to keep your version.
 * Only the fluent method changes: `Functions` and the library internals keep the original behaviour.
 * @param name - an existing chain method; `constructor` and `Object.prototype` members are rejected
 * @param implementation - the new method; `this` is the chain, typed `IIterableLinq<unknown>`
 * @throws Error if `name` is not a chain method (use `extend` to add it), is empty, or `implementation` is not a function
 * @example
 * ```ts
 * // a library release added its own `chunk`: keep your version
 * override('chunk', function (size: number) {
 * 	return IterableLinq.from({ [Symbol.iterator]: () => chunks(this, size) });
 * });
 * ```
 * @since 0.1.0
 */
export function override<K extends Extract<keyof IIterableLinq<unknown>, string>>(name: K, implementation: ChainMethod): void {
	validateMethod('override', name, implementation);
	const key: string = name;
	const isChainMethod = key !== 'constructor' && Object.prototype.hasOwnProperty.call(wrapperPrototype(), key);
	if (!isChainMethod)
		throw libraryError('override', `"${key}" is not a method of IIterableLinq: use extend() to add it`);
	defineChainMethod(key, implementation);
}
