import { describe, expect, expectTypeOf, test } from 'vitest';

import { collectToArray, fromObject, take } from '@/functions';
import { returnClosesTheIterator } from './functionsTestUtility';

const sym = Symbol('sym');

class Base {
	inheritedKey = 'own, from the constructor';
	baseMethod(): string {
		return 'base';
	}
}

/** An object with every kind of property: own and inherited, enumerable and not, string and symbol keys. */
function sample() {
	const base = { shared: 'base', baseOnly: 'base', [sym]: 'base symbol' };
	Object.defineProperty(base, 'hiddenBase', { value: 'hidden base', enumerable: false });
	const object = Object.create(base) as Record<PropertyKey, unknown>;
	object.b = 2;
	object.a = 1;
	object[1] = 'one';
	object.shared = 'own';
	object[sym] = 'own symbol';
	Object.defineProperty(object, 'hidden', { value: 'hidden', enumerable: false });
	return { base, object };
}

function forIn(object: object): string[] {
	const keys: string[] = [];
	for (const key in object)
		keys.push(key);
	return keys;
}

describe('fromObject', () => {

	test('yields the entries by default, like Object.entries', () => {
		const { object } = sample();
		expect(collectToArray(fromObject(object))).toEqual(Object.entries(object));
		expect(collectToArray(fromObject(object))).toEqual([['1', 'one'], ['b', 2], ['a', 1], ['shared', 'own']]);
	});

	test.each([
		{ yield: 'entries' as const, native: Object.entries },
		{ yield: 'keys' as const, native: Object.keys },
		{ yield: 'values' as const, native: Object.values }
	])('yield: $yield matches the native function', ({ yield: kind, native }) => {
		const { object } = sample();
		expect(collectToArray(fromObject(object, { yield: kind }))).toEqual(native(object));
	});

	test('nonEnumerable matches Object.getOwnPropertyNames', () => {
		const { object } = sample();
		expect(collectToArray(fromObject(object, { yield: 'keys', nonEnumerable: true }))).toEqual(Object.getOwnPropertyNames(object));
	});

	test('nonEnumerable and symbols match Reflect.ownKeys', () => {
		const { object } = sample();
		expect(collectToArray(fromObject(object, { yield: 'keys', nonEnumerable: true, symbols: true }))).toEqual(Reflect.ownKeys(object));
	});

	test('symbols adds the enumerable symbol keys after the strings', () => {
		const { object } = sample();
		expect(collectToArray(fromObject(object, { yield: 'keys', symbols: true }))).toEqual(['1', 'b', 'a', 'shared', sym]);
		expect(collectToArray(fromObject(object, { symbols: true })).at(-1)).toEqual([sym, 'own symbol']);
	});

	test('inherited matches for…in, and a key is yielded once, from the nearest object', () => {
		const { object } = sample();
		expect(collectToArray(fromObject(object, { yield: 'keys', inherited: true }))).toEqual(forIn(object));
		expect(collectToArray(fromObject(object, { inherited: true }))).toEqual([['1', 'one'], ['b', 2], ['a', 1], ['shared', 'own'], ['baseOnly', 'base']]);
	});

	test('inherited with every flag reads the whole prototype chain, except Object.prototype', () => {
		const { object } = sample();
		expect(collectToArray(fromObject(object, { yield: 'keys', inherited: true, nonEnumerable: true, symbols: true })))
			.toEqual(['1', 'b', 'a', 'shared', 'hidden', sym, 'baseOnly', 'hiddenBase']);
	});

	test('a non-enumerable own key shadows an enumerable inherited one, like for…in', () => {
		const base = { key: 'inherited' };
		const object = Object.create(base);
		Object.defineProperty(object, 'key', { value: 'own', enumerable: false });
		expect(forIn(object)).toEqual([]);
		expect(collectToArray(fromObject(object, { inherited: true }))).toEqual([]);
	});

	test('inherited reads the prototype of a class instance, without its non-enumerable methods', () => {
		const instance = new Base();
		expect(collectToArray(fromObject(instance, { yield: 'keys', inherited: true }))).toEqual(['inheritedKey']);
		expect(collectToArray(fromObject(instance, { yield: 'keys', inherited: true, nonEnumerable: true }))).toEqual(['inheritedKey', 'constructor', 'baseMethod']);
	});

	test('inherited stops at a null prototype', () => {
		const base = Object.assign(Object.create(null), { b: 2 });
		const object = Object.assign(Object.create(base), { a: 1 });
		expect(collectToArray(fromObject(object, { inherited: true }))).toEqual([['a', 1], ['b', 2]]);
	});

	test('Object.prototype is read when it is the object itself', () => {
		expect(collectToArray(fromObject(Object.prototype, { yield: 'keys', nonEnumerable: true }))).toEqual(Object.getOwnPropertyNames(Object.prototype));
	});

	test('descriptors yields the key, the descriptor and the owner, without calling the getters', () => {
		const { base, object } = sample();
		let calls = 0;
		Object.defineProperty(object, 'getter', { get: () => ++calls, enumerable: true });
		const descriptors = collectToArray(fromObject(object, { yield: 'descriptors', inherited: true }));
		expect(calls).toBe(0);
		expect(descriptors.map(([key]) => key)).toEqual(['1', 'b', 'a', 'shared', 'getter', 'baseOnly']);
		expect(descriptors[1]).toEqual(['b', { value: 2, writable: true, enumerable: true, configurable: true }, object]);
		expect(descriptors[4][1].get).toBeTypeOf('function');
		expect(descriptors[5][2]).toBe(base);
	});

	test('a getter runs when its value is yielded, with the object as this', () => {
		const object = {
			calls: [] as string[],
			get first() {
				this.calls.push('first');
				return 1;
			},
			get second() {
				this.calls.push('second');
				return 2;
			}
		};
		const iterator = fromObject(object, { yield: 'values' })[Symbol.iterator]();
		iterator.next();
		iterator.next();
		expect(object.calls).toEqual(['first']);
		iterator.next();
		expect(object.calls).toEqual(['first', 'second']);
	});

	test('an inherited getter runs with the object as this', () => {
		const base = {
			own: 'base',
			get name(): string {
				return this.own;
			}
		};
		const object = Object.assign(Object.create(base), { own: 'object' });
		expect(collectToArray(fromObject(object, { inherited: true }))).toEqual([['own', 'object'], ['name', 'object']]);
	});

	test('the error of a getter propagates', () => {
		const object = {
			get broken(): never {
				throw new Error('getter');
			}
		};
		expect(() => collectToArray(fromObject(object))).toThrow(new Error('getter'));
	});

	test('reads the object again at each run', () => {
		const object: Record<string, number> = { a: 1 };
		const iterable = fromObject(object);
		expect(collectToArray(iterable)).toEqual([['a', 1]]);
		object.b = 2;
		expect(collectToArray(iterable)).toEqual([['a', 1], ['b', 2]]);
	});

	test('a key deleted during a run is skipped, a key added is not read, like Object.keys', () => {
		const object: Record<string, number> = { a: 1, b: 2, c: 3 };
		const values: unknown[] = [];
		for (const [key, value] of fromObject(object)) {
			values.push([key, value]);
			if (key === 'a') {
				delete object.b;
				object.d = 4;
			}
		}
		expect(values).toEqual([['a', 1], ['c', 3]]);
	});

	test('the keys of a prototype are read when the iteration reaches it', () => {
		const base: Record<string, number> = { b: 2 };
		const object = Object.assign(Object.create(base), { a: 1 });
		const iterator = fromObject(object, { inherited: true })[Symbol.iterator]();
		expect(iterator.next().value).toEqual(['a', 1]);
		base.c = 3;
		expect([...{ [Symbol.iterator]: () => iterator }]).toEqual([['b', 2], ['c', 3]]);
	});

	test('reads arrays, functions and objects without properties', () => {
		expect(collectToArray(fromObject(['x', 'y']))).toEqual([['0', 'x'], ['1', 'y']]);
		expect(collectToArray(fromObject(['x'], { yield: 'keys', nonEnumerable: true }))).toEqual(['0', 'length']);
		expect(collectToArray(fromObject(Object.assign(() => 0, { a: 1 })))).toEqual([['a', 1]]);
		expect(collectToArray(fromObject({}))).toEqual([]);
	});

	test('reads a Proxy through its traps', () => {
		const proxy = new Proxy({ a: 1 }, { get: (target, key) => key === 'a' ? 'trapped' : Reflect.get(target, key) });
		expect(collectToArray(fromObject(proxy))).toEqual([['a', 'trapped']]);
	});

	test('stops early', () => {
		expect(collectToArray(take(fromObject({ a: 1, b: 2, c: 3 }, { yield: 'keys' }), 2))).toEqual(['a', 'b']);
	});

	test.each([
		{ returnValue: 'a value' },
		{ returnValue: null },
		{}
	])('fromObject(…)[Symbol.iterator]().return() closes the iterator', ({ returnValue }) => {
		returnClosesTheIterator(fromObject({ a: 1, b: 2 }), returnValue);
	});

	test('iterator stays done', () => {
		const iterator = fromObject({ a: 1 })[Symbol.iterator]();
		iterator.next();
		for (let i = 0; i < 3; i++)
			expect(iterator.next().done).toBe(true);
	});

	test.each([null, undefined, 1, 'abc', true, Symbol('s')])('throws for the object %s', object => {
		expect(() => fromObject(object as any)).toThrow(new Error('[iterable-linq-utility/fromObject] The "object" parameter must be an object'));
	});

	test('throws for invalid options', () => {
		expect(() => fromObject({}, 42 as any)).toThrow(new Error('[iterable-linq-utility/fromObject] The "options" parameter must be an object'));
		expect(() => fromObject({}, { yield: 'pairs' as any })).toThrow(new Error('[iterable-linq-utility/fromObject] The "yield" option must be "entries", "keys", "values" or "descriptors"'));
		expect(() => fromObject({}, { yield: 'toString' as any })).toThrow(new Error('[iterable-linq-utility/fromObject] The "yield" option must be "entries", "keys", "values" or "descriptors"'));
		for (const name of ['inherited', 'nonEnumerable', 'symbols'])
			expect(() => fromObject({}, { [name]: 1 })).toThrow(new Error(`[iterable-linq-utility/fromObject] The "${name}" option must be a boolean`));
	});

	test('validates when called, not when read', () => {
		expect(() => fromObject(null as any)).toThrow(Error);
		expect(fromObject({}, {})).toBeDefined();
	});

	test('types', () => {
		const object = { a: 1, b: 'x', 2: true, [sym]: null };
		expectTypeOf(fromObject(object)).toEqualTypeOf<Iterable<['a' | 'b' | '2', number | string | boolean]>>();
		expectTypeOf(fromObject(object, {})).toEqualTypeOf<Iterable<['a' | 'b' | '2', number | string | boolean]>>();
		expectTypeOf(fromObject(object, { yield: 'keys' })).toEqualTypeOf<Iterable<'a' | 'b' | '2'>>();
		expectTypeOf(fromObject(object, { yield: 'values' })).toEqualTypeOf<Iterable<number | string | boolean>>();
		expectTypeOf(fromObject(object, { yield: 'keys', symbols: true })).toEqualTypeOf<Iterable<'a' | 'b' | '2' | typeof sym>>();
		expectTypeOf(fromObject(object, { yield: 'values', symbols: true })).toEqualTypeOf<Iterable<number | string | boolean | null>>();
		expectTypeOf(fromObject(object, { yield: 'keys', inherited: false, nonEnumerable: false })).toEqualTypeOf<Iterable<'a' | 'b' | '2'>>();
		expectTypeOf(fromObject(object, { yield: 'keys', inherited: true })).toEqualTypeOf<Iterable<string>>();
		expectTypeOf(fromObject(object, { nonEnumerable: true, symbols: true })).toEqualTypeOf<Iterable<[string | symbol, unknown]>>();
		expectTypeOf(fromObject(object, { yield: 'descriptors' })).toEqualTypeOf<Iterable<['a' | 'b' | '2', PropertyDescriptor, object]>>();
		expectTypeOf(fromObject({} as Record<string, number>)).toEqualTypeOf<Iterable<[string, number]>>();
		// options typed wider than literals give the wide types, as they may read more at runtime
		const flags: { inherited?: boolean } = {};
		expectTypeOf(fromObject(object, flags)).toEqualTypeOf<Iterable<[string, unknown]>>();
		const optionalYield: { yield?: 'keys' } = {};
		expectTypeOf(fromObject(object, optionalYield)).toEqualTypeOf<Iterable<'a' | 'b' | '2' | ['a' | 'b' | '2', number | string | boolean]>>();
	});

});
