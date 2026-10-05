import { describe, expect, expectTypeOf, test } from 'vitest';
import { expectTransformation } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('IterableLinq.except', () => {
	test.each([null, false, 0, 'key', {}])('rejects invalid keySelector %j', keySelector => {
		expect(() => IterableLinq.from([1]).except([], keySelector as never)).toThrow(new Error('[iterable-linq-utility/except] The "keySelector" function must be provided'));
	});

	test('rejects an invalid other', () => {
		expect(() => IterableLinq.from([1]).except(null as never)).toThrow(new Error('[iterable-linq-utility/except] The "sourceIterable" must be provided'));
	});

	test('compares the values with SameValueZero', () => {
		expect(IterableLinq.from([1, 2, 2]).except([2, 3]).collectToArray()).toEqual([1]);
		expect(IterableLinq.from([1, 2, 2]).except([2, 3], undefined).collectToArray()).toEqual([1]);
	});

	test('compares the selected keys and accepts another chain', () => {
		const values = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }];
		const other = IterableLinq.from([{ id: 2, name: 'c' }, { id: 3, name: 'd' }]);
		expect(IterableLinq.from(values).except(other, value => value.id).map(value => value.name).collectToArray()).toEqual(['a']);
	});

	test('is a lazy, re-runnable Transformation', () => {
		expectTransformation(source => IterableLinq.from(source).except([2, 9]));
	});

	test('preserves the element type', () => {
		expectTypeOf(IterableLinq.from([1]).except([2])).toEqualTypeOf<IterableLinq.IIterableLinq<number>>();
		expectTypeOf(IterableLinq.from([{ id: 1 }]).except([{ id: 2 }], value => value.id)).toEqualTypeOf<IterableLinq.IIterableLinq<{ id: number }>>();
	});
});
