import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import * as IterableLinq from '@/index';
import { empty, extend, from, fromRange, Functions, isIterableLinq, override, repeat } from '@/index';
import { unit } from '@/types';

declare module '@/types' {
	interface IIterableLinq<T> {
		batch(size: number): IIterableLinq<T[]>;
		double(): IIterableLinq<number>;
		twice(): IIterableLinq<number>;
	}
}

const proto = Object.getPrototypeOf(from([]));
const hasOwn = (name: string) => Object.prototype.hasOwnProperty.call(proto, name);

// every test starts from the same prototype: new names are removed, changed ones restored
let snapshot: Map<PropertyKey, PropertyDescriptor>;
beforeEach(() => {
	snapshot = new Map(Reflect.ownKeys(proto).map(key => [key, Object.getOwnPropertyDescriptor(proto, key)!]));
});
afterEach(() => {
	for (const key of Reflect.ownKeys(proto))
		if (!snapshot.has(key))
			delete proto[key];
	for (const [key, descriptor] of snapshot)
		if (descriptor.configurable)
			Object.defineProperty(proto, key, descriptor);
});

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

	const double = function (this: IterableLinq.IIterableLinq<unknown>) {
		return from(this).map(v => (v as number) * 2);
	};

	test('adds a method to chains created before and after the call', () => {
		const before = from([1, 2]);
		extend('double', double);
		expect(before.double().collectToArray()).toEqual([2, 4]);
		expect(from([3]).double().collectToArray()).toEqual([6]);
	});

	test('batch example', () => {
		extend('batch', function (size: number) {
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
		expect(from([1, 2, 3, 4, 5]).batch(2).collectToArray()).toEqual([[1, 2], [3, 4], [5]]);
	});

	test('the result is still a chain', () => {
		extend('double', double);
		expect(isIterableLinq(from([1]).double())).toBe(true);
		expect(from([1]).double().map(v => v + 1).collectToArray()).toEqual([3]);
	});

	test('throws for a library method', () => {
		expect(() => extend('map', function () { return this; })).toThrow(new Error('[iterable-linq-utility/extend] "map" already exists on IIterableLinq: use override() to replace it'));
	});

	test('a second registration replaces the method on chains created before and after it', () => {
		extend('twice', function () { return from([1]); });
		const before = from([0]);
		extend('twice', function () { return from([2]); });
		expect(before.twice().collectToArray()).toEqual([2]);
		expect(from([0]).twice().collectToArray()).toEqual([2]);
		expect(Object.getOwnPropertyDescriptor(proto, 'twice')).toMatchObject({ enumerable: false, writable: false, configurable: true });
	});

	test('a registration after override of an extension replaces the method', () => {
		extend('twice', function () { return from([1]); });
		override('twice', function () { return from([42]); });
		extend('twice', function () { return from([3]); });
		expect(from([0]).twice().collectToArray()).toEqual([3]);
	});

	test('throws for a library method replaced by override', () => {
		override('map', function () { return this; });
		expect(() => extend('map', function () { return this; })).toThrow(new Error('[iterable-linq-utility/extend] "map" already exists on IIterableLinq: use override() to replace it'));
	});

	test('throws for Object.prototype members', () => {
		expect(() => extend('toString' as any, double)).toThrow(Error);
		expect(() => extend('hasOwnProperty' as any, double)).toThrow(Error);
		expect(() => extend('valueOf' as any, double)).toThrow(Error);
		for (const name of ['toString', 'hasOwnProperty', 'valueOf'])
			expect(hasOwn(name)).toBe(false);
	});

	test('throws for a name used by the chain instances', () => {
		expect(() => extend('iterable' as any, double)).toThrow(new Error('[iterable-linq-utility/extend] "iterable" already exists on IIterableLinq: use override() to replace it'));
		expect(hasOwn('iterable')).toBe(false);
	});

	test('throws for invalid input', () => {
		expect(() => extend('' as any, double)).toThrow(new Error('[iterable-linq-utility/extend] The "name" parameter must be a non-empty string'));
		expect(() => extend('double', 42 as any)).toThrow(new Error('[iterable-linq-utility/extend] The "implementation" function must be provided'));
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

	const overridden = function () {
		return from(['overridden']);
	};

	test('replaces a library method on chains created before and after the call', () => {
		const before = from([1, 2]);
		override('map', overridden);
		expect(before.map(v => v).collectToArray()).toEqual(['overridden']);
		expect(from([3]).map(v => v).collectToArray()).toEqual(['overridden']);
	});

	test('override keeps the writable flag of the method it replaces', () => {
		const libraryWritable = Object.getOwnPropertyDescriptor(proto, 'map')!.writable;
		override('map', overridden);
		expect(Object.getOwnPropertyDescriptor(proto, 'map')!.writable).toBe(libraryWritable);

		extend('twice', function () { return from([1]); });
		override('twice', function () { return from([42]); });
		expect(Object.getOwnPropertyDescriptor(proto, 'twice')!.writable).toBe(false);
	});

	test('Functions.map is unaffected', () => {
		override('map', overridden);
		expect(Functions.collectToArray(Functions.map([1], v => v + 1))).toEqual([2]);
	});

	test('other methods are unaffected', () => {
		override('map', overridden);
		expect(from([1, 2, 3]).filter(v => v > 1).collectToArray()).toEqual([2, 3]);
		expect(from([1, 2]).flatMap(v => [v, v]).collectToArray()).toEqual([1, 1, 2, 2]);
		expect(from([1, 2, 3]).reduce(0, (acc, v) => acc + v)).toBe(6);
		expect(from([1, 2, 3]).some(v => v === 2)).toBe(true);
		expect(from([3, 1, 2]).max()).toBe(3);
	});

	test('replaces a method added by extend', () => {
		extend('twice', function () { return from([1]); });
		override('twice', function () { return from([42]); });
		expect(from([1]).twice().collectToArray()).toEqual([42]);
	});

	test('throws for a name that does not exist, suggesting extend', () => {
		expect(() => override('batch', overridden)).toThrow(new Error('[iterable-linq-utility/override] "batch" is not a method of IIterableLinq: use extend() to add it'));
	});

	test('throws for Object.prototype members', () => {
		expect(() => override('toString' as any, overridden)).toThrow(Error);
		expect(() => override('constructor' as any, overridden)).toThrow(Error);
		expect(() => override('hasOwnProperty' as any, overridden)).toThrow(Error);
	});

	test('throws for invalid input', () => {
		expect(() => override('' as any, overridden)).toThrow(new Error('[iterable-linq-utility/override] The "name" parameter must be a non-empty string'));
		expect(() => override('map', 42 as any)).toThrow(new Error('[iterable-linq-utility/override] The "implementation" function must be provided'));
	});

	test('the name must be declared on IIterableLinq', () => {
		const typeOnly = () => {
			// @ts-expect-error 'notDeclared' is not a key of IIterableLinq
			override('notDeclared', overridden);
		};
		expect(typeOnly).toBeTypeOf('function');
	});

	test('symbol names are rejected at compile time', () => {
		const typeOnly = () => {
			// @ts-expect-error only string names can be extended
			extend(Symbol.iterator, overridden);
			// @ts-expect-error only string names can be overridden
			override(Symbol.iterator, overridden);
		};
		expect(typeOnly).toBeTypeOf('function');
	});

});
