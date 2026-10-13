import { describe, expectTypeOf, test } from 'vitest';

import { KeysOfType } from '@/types';

interface IRecord {
	id: number;
	name: string;
	price?: number;
	tags: string[];
}

describe('KeysOfType', () => {

	test('gives the keys whose value is assignable to the type', () => {
		expectTypeOf<KeysOfType<IRecord, number>>().toEqualTypeOf<'id'>();
		expectTypeOf<KeysOfType<IRecord, string>>().toEqualTypeOf<'name'>();
		expectTypeOf<KeysOfType<IRecord, Iterable<unknown>>>().toEqualTypeOf<'name' | 'tags'>();
	});

	test('leaves out an optional property, whose value can be undefined', () => {
		expectTypeOf<'price'>().not.toExtend<KeysOfType<IRecord, number>>();
	});

	test('gives the indices of a tuple, and number for an array', () => {
		expectTypeOf<KeysOfType<[string, number], number>>().toEqualTypeOf<1>();
		expectTypeOf<KeysOfType<readonly [string, number[]], Iterable<unknown>>>().toEqualTypeOf<0 | 1>();
		expectTypeOf<KeysOfType<number[], number>>().toEqualTypeOf<number>();
		expectTypeOf<KeysOfType<string[], number>>().toEqualTypeOf<never>();
	});

});
