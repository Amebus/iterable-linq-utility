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

});
