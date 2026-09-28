/**
 * Brand that marks every chain. It lives in the global symbol registry,
 * so chains are recognised even when two copies of the library are loaded.
 */
export const iterableLinqBrand: unique symbol = Symbol.for('iterable-linq-utility.IIterableLinq');
