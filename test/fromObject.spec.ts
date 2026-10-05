import { describe, expect, expectTypeOf, test } from 'vitest';

import * as IterableLinq from '@/index';

describe('IterableLinq.fromObject', () => {

	test('yields the entries by default', () => {
		const r = IterableLinq
			.fromObject({ a: 1, b: 2 })
			.collectToArray();
		expect(r).toEqual([['a', 1], ['b', 2]]);
	});

	test.each([
		{ yield: 'keys' as const, expectedResult: ['a', 'b'] },
		{ yield: 'values' as const, expectedResult: [1, 2] }
	])('IterableLinq.fromObject({ a: 1, b: 2 }, { yield: $yield }) -> $expectedResult', ({ yield: kind, expectedResult }) => {
		expect(IterableLinq.fromObject({ a: 1, b: 2 }, { yield: kind }).collectToArray()).toEqual(expectedResult);
	});

	test('reads the inherited, non-enumerable and symbol keys with the options', () => {
		const sym = Symbol('sym');
		const object = Object.assign(Object.create({ inherited: 1 }), { own: 2, [sym]: 3 });
		Object.defineProperty(object, 'hidden', { value: 4, enumerable: false });
		expect(IterableLinq.fromObject(object, { yield: 'keys', inherited: true, nonEnumerable: true, symbols: true }).collectToArray())
			.toEqual(['own', 'hidden', sym, 'inherited']);
	});

	test('descriptors can be narrowed with filter', () => {
		const object = Object.assign(Object.create({ inherited: 1 }), { own: 2 });
		const inherited = IterableLinq
			.fromObject(object, { yield: 'descriptors', inherited: true })
			.filter(([, , owner]) => owner !== object)
			.map(([key]) => key)
			.collectToArray();
		expect(inherited).toEqual(['inherited']);
	});

	test('the chain is re-runnable and reads the object again', () => {
		const object: Record<string, number> = { a: 1 };
		const chain = IterableLinq.fromObject(object, { yield: 'keys' });
		expect(chain.collectToArray()).toEqual(['a']);
		object.b = 2;
		expect(chain.collectToArray()).toEqual(['a', 'b']);
	});

	test('throws for invalid input', () => {
		expect(() => IterableLinq.fromObject(null as any)).toThrow(new Error('[iterable-linq-utility/fromObject] The "object" parameter must be an object'));
		expect(() => IterableLinq.fromObject({}, { yield: 'pairs' as any })).toThrow(new Error('[iterable-linq-utility/fromObject] The "yield" option must be "entries", "keys", "values" or "descriptors"'));
		expect(() => IterableLinq.fromObject({}, { symbols: 'yes' as any })).toThrow(new Error('[iterable-linq-utility/fromObject] The "symbols" option must be a boolean'));
	});

	test('types', () => {
		const object = { a: 1, b: 'x' };
		expectTypeOf(IterableLinq.fromObject(object)).toEqualTypeOf<IterableLinq.IIterableLinq<['a' | 'b', number | string]>>();
		expectTypeOf(IterableLinq.fromObject(object, { yield: 'keys' })).toEqualTypeOf<IterableLinq.IIterableLinq<'a' | 'b'>>();
		expectTypeOf(IterableLinq.fromObject(object, { yield: 'values', inherited: true })).toEqualTypeOf<IterableLinq.IIterableLinq<unknown>>();
	});

});
