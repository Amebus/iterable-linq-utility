import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import * as IterableLinq from '@/index';
import { empty, extend, from, fromRange, Functions, isIterableLinq, override, repeat } from '@/index';
import { unit } from '@/types';

declare module '@/types' {
	interface IIterableLinq<T> {
		chunk(size: number): IIterableLinq<T[]>;
		double(): IIterableLinq<number>;
		twice(): IIterableLinq<number>;
	}
}

const proto = Object.getPrototypeOf(from([]));
const hasOwn = (name: string) => Object.prototype.hasOwnProperty.call(proto, name);

describe('isIterableLinq', () => {

	test.each([
		{ name: 'from', chain: () => from([1]) },
		{ name: 'fromRange', chain: () => fromRange(3) },
		{ name: 'repeat', chain: () => repeat(1, 2) },
		{ name: 'empty', chain: () => empty() },
		{ name: 'map', chain: () => from([1]).map(v => v) }
	])('$name returns a chain', ({ chain }) => {
		expect(isIterableLinq(chain())).toBe(true);
	});

	test.each([
		{ name: 'array', value: [] },
		{ name: 'null', value: null },
		{ name: 'undefined', value: undefined },
		{ name: 'plain object', value: {} },
		{ name: 'string', value: 'abc' },
		{ name: 'generator', value: (function* () { yield 1; })() },
		{ name: 'Set', value: new Set([1]) }
	])('$name is not a chain', ({ value }) => {
		expect(isIterableLinq(value)).toBe(false);
	});

	test('tapChainCreation passes a chain', () => {
		let seen = false;
		from([1]).tapChainCreation(chain => {
			seen = isIterableLinq(chain);
			return unit();
		});
		expect(seen).toBe(true);
	});

	test('the wrapper class is not exported', () => {
		expect('IterableLinqWrapper' in IterableLinq).toBe(false);
	});

});

describe('extend', () => {

	afterEach(() => {
		for (const name of ['chunk', 'double', 'twice'])
			if (hasOwn(name))
				delete proto[name];
	});

	const double = function (this: IterableLinq.IIterableLinq<unknown>) {
		return from(this).map(v => (v as number) * 2);
	};

	test('adds a method to chains created before and after the call', () => {
		const before = from([1, 2]);
		extend('double', double);
		expect(before.double().collectToArray()).toEqual([2, 4]);
		expect(from([3]).double().collectToArray()).toEqual([6]);
	});

	test('chunk example', () => {
		extend('chunk', function (size: number) {
			const source = this;
			return from({
				*[Symbol.iterator]() {
					let chunk: unknown[] = [];
					for (const value of source) {
						chunk.push(value);
						if (chunk.length === size) {
							yield chunk;
							chunk = [];
						}
					}
					if (chunk.length > 0)
						yield chunk;
				}
			});
		});
		expect(from([1, 2, 3, 4, 5]).chunk(2).collectToArray()).toEqual([[1, 2], [3, 4], [5]]);
	});

	test('the result is still a chain', () => {
		extend('double', double);
		expect(isIterableLinq(from([1]).double())).toBe(true);
		expect(from([1]).double().map(v => v + 1).collectToArray()).toEqual([3]);
	});

	test('throws for a library method', () => {
		expect(() => extend('map', function () { return this; })).toThrow(Error);
	});

	test('throws for a second registration', () => {
		extend('double', double);
		expect(() => extend('double', double)).toThrow(Error);
	});

	test('throws for Object.prototype members', () => {
		expect(() => extend('toString' as any, double)).toThrow(Error);
		expect(() => extend('hasOwnProperty' as any, double)).toThrow(Error);
		expect(hasOwn('toString')).toBe(false);
	});

	test('throws for a name used by the chain instances', () => {
		expect(() => extend('iterable' as any, double)).toThrow(Error);
		expect(hasOwn('iterable')).toBe(false);
	});

	test('throws for invalid input', () => {
		expect(() => extend('' as any, double)).toThrow(Error);
		expect(() => extend('double', 42 as any)).toThrow(Error);
		expect(hasOwn('double')).toBe(false);
	});

	test('extended methods are not enumerable and not writable', () => {
		extend('double', double);
		expect(Object.getOwnPropertyDescriptor(proto, 'double')).toMatchObject({ enumerable: false, writable: false, configurable: true });
	});

	test('the name must be declared on IIterableLinq', () => {
		const typeOnly = () => {
			// @ts-expect-error 'notDeclared' is not a key of IIterableLinq
			extend('notDeclared', double);
		};
		expect(typeOnly).toBeTypeOf('function');
	});

});

describe('override', () => {

	let savedMap: PropertyDescriptor | undefined;
	let savedFilter: PropertyDescriptor | undefined;

	beforeEach(() => {
		savedMap = Object.getOwnPropertyDescriptor(proto, 'map');
		savedFilter = Object.getOwnPropertyDescriptor(proto, 'filter');
	});

	afterEach(() => {
		Object.defineProperty(proto, 'map', savedMap!);
		Object.defineProperty(proto, 'filter', savedFilter!);
		if (hasOwn('twice'))
			delete proto.twice;
	});

	const overridden = function () {
		return from(['overridden']);
	};

	test('replaces a library method on chains created before and after the call', () => {
		const before = from([1, 2]);
		override('map', overridden);
		expect(before.map(v => v).collectToArray()).toEqual(['overridden']);
		expect(from([3]).map(v => v).collectToArray()).toEqual(['overridden']);
	});

	test('Functions.map is unaffected', () => {
		override('map', overridden);
		expect(Functions.collectToArray(Functions.map([1], v => v + 1))).toEqual([2]);
	});

	test('other methods are unaffected', () => {
		override('map', overridden);
		expect(from([1, 2, 3]).filter(v => v > 1).collectToArray()).toEqual([2, 3]);
	});

	test('replaces a method added by extend', () => {
		extend('twice', function () { return from([1]); });
		override('twice', function () { return from([42]); });
		expect(from([1]).twice().collectToArray()).toEqual([42]);
	});

	test('throws for a name that does not exist, suggesting extend', () => {
		expect(() => override('chunk', overridden)).toThrow(/extend/);
	});

	test('throws for Object.prototype members', () => {
		expect(() => override('toString' as any, overridden)).toThrow(Error);
		expect(() => override('constructor' as any, overridden)).toThrow(Error);
		expect(() => override('hasOwnProperty' as any, overridden)).toThrow(Error);
	});

	test('throws for invalid input', () => {
		expect(() => override('' as any, overridden)).toThrow(Error);
		expect(() => override('map', 42 as any)).toThrow(Error);
	});

	test('the name must be declared on IIterableLinq', () => {
		const typeOnly = () => {
			// @ts-expect-error 'notDeclared' is not a key of IIterableLinq
			override('notDeclared', overridden);
		};
		expect(typeOnly).toBeTypeOf('function');
	});

});
