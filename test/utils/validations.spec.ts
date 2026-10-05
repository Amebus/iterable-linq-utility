import { describe, expect, test } from 'vitest';

import { Validations } from '@/utils';

const ITERABLE_MISSING = 'The "sourceIterable" must be provided';
const ITERABLE_INVALID = 'The provided "sourceIterable" does not conform to the iterator protocol https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterable_protocol. It must implement the "[Symbol.iterator]" function.';

function prefixed(operation: string, message: string) {
	return `[iterable-linq-utility/${operation}] ${message}`;
}

describe('Validations', () => {

	describe('throwIfNotIterable', () => {
		test.each<{ name: string; value: Iterable<unknown> }>([
			{ name: 'an array', value: [] },
			{ name: 'a string', value: 'abc' },
			{ name: 'a Set', value: new Set([1]) },
			{ name: 'a Map', value: new Map() },
			{ name: 'a generator', value: (function* () { yield 1; })() }
		])('accepts $name', ({ value }) => {
			expect(() => Validations.throwIfNotIterable(value, 'op')).not.toThrow();
		});

		test.each([undefined, null])('rejects %j as missing', value => {
			expect(() => Validations.throwIfNotIterable(value as never, 'op')).toThrow(new Error(prefixed('op', ITERABLE_MISSING)));
		});

		test.each([
			{ name: 'a number', value: 0 },
			{ name: 'a plain object', value: {} },
			{ name: 'a boolean', value: true },
			{ name: 'an object whose [Symbol.iterator] is not a function', value: { [Symbol.iterator]: 'not a function' } }
		])('rejects $name as not iterable', ({ value }) => {
			expect(() => Validations.throwIfNotIterable(value as never, 'op')).toThrow(new Error(prefixed('op', ITERABLE_INVALID)));
		});
	});

	describe('throwIfNotFunction', () => {
		test.each([
			{ name: 'an arrow function', value: () => 1 },
			{ name: 'a function', value: function named() { return 1; } },
			{ name: 'a class', value: class { } }
		])('accepts $name', ({ value }) => {
			expect(() => Validations.throwIfNotFunction(value, 'predicate', 'op')).not.toThrow();
		});

		test.each([undefined, null, 0, 'f', {}])('rejects %j', value => {
			expect(() => Validations.throwIfNotFunction(value, 'predicate', 'op'))
				.toThrow(new Error(prefixed('op', 'The "predicate" function must be provided')));
		});
	});

	describe('throwIfNotInteger', () => {
		test.each([0, -0, 3, -3, Number.MAX_SAFE_INTEGER])('accepts %s', value => {
			expect(() => Validations.throwIfNotInteger(value, 'index', 'op')).not.toThrow();
		});

		test.each([0.5, NaN, Infinity, -Infinity, '1'])('rejects %s', value => {
			expect(() => Validations.throwIfNotInteger(value as never, 'index', 'op'))
				.toThrow(new Error(prefixed('op', 'The "index" parameter must be an integer')));
		});
	});

	describe('throwIfNotNonNegativeInteger', () => {
		test.each([0, 1, 100])('accepts %s', value => {
			expect(() => Validations.throwIfNotNonNegativeInteger(value, 'count', 'op')).not.toThrow();
		});

		test.each([-1, 0.5, NaN, Infinity, '1'])('rejects %s', value => {
			expect(() => Validations.throwIfNotNonNegativeInteger(value as never, 'count', 'op'))
				.toThrow(new Error(prefixed('op', 'The "count" parameter must be a non-negative integer')));
		});
	});

	describe('throwIfNotPositiveInteger', () => {
		test.each([1, 2, 100])('accepts %s', value => {
			expect(() => Validations.throwIfNotPositiveInteger(value, 'size', 'op')).not.toThrow();
		});

		test.each([0, -0, -1, 0.5, 1.5, NaN, Infinity, '1'])('rejects %s', value => {
			expect(() => Validations.throwIfNotPositiveInteger(value as never, 'size', 'op'))
				.toThrow(new Error(prefixed('op', 'The "size" parameter must be a positive integer')));
		});
	});

	describe('throwIfNotFiniteNonZero', () => {
		test.each([1, -1, 0.25, -0.5])('accepts %s', value => {
			expect(() => Validations.throwIfNotFiniteNonZero(value, 'step', 'op')).not.toThrow();
		});

		test.each([0, -0, NaN, Infinity, -Infinity, '1'])('rejects %s', value => {
			expect(() => Validations.throwIfNotFiniteNonZero(value as never, 'step', 'op'))
				.toThrow(new Error(prefixed('op', 'The "step" parameter must be a finite number other than 0')));
		});
	});

	describe('throwIfNotObject', () => {
		test.each([
			{ name: 'a plain object', value: {} },
			{ name: 'an array', value: [] },
			{ name: 'a Date', value: new Date() }
		])('accepts $name', ({ value }) => {
			expect(() => Validations.throwIfNotObject(value, 'options', 'op')).not.toThrow();
		});

		test.each([undefined, null, 0, 'o', true, () => ({})])('rejects %j', value => {
			expect(() => Validations.throwIfNotObject(value, 'options', 'op'))
				.toThrow(new Error(prefixed('op', 'The "options" parameter must be an object')));
		});
	});

	describe('throwIfNotNonEmptyString', () => {
		test.each(['a', ' '])('accepts %j', value => {
			expect(() => Validations.throwIfNotNonEmptyString(value, 'name', 'op')).not.toThrow();
		});

		test.each(['', undefined, null, 0, {}])('rejects %j', value => {
			expect(() => Validations.throwIfNotNonEmptyString(value, 'name', 'op'))
				.toThrow(new Error(prefixed('op', 'The "name" parameter must be a non-empty string')));
		});
	});

});
