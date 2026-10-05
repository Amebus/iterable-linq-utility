import { describe, expect, expectTypeOf, test } from 'vitest';
import { expectTransformation } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';
import { withoutInputFunctionThrowsException } from './linqIterableWrapperTestUtility';

describe('IterableLinq.groupBy', () => {
	test('IterableLinq.groupBy without keySelector -> throw exception', () => {
		withoutInputFunctionThrowsException(IterableLinq.fromRange(0, 20), 'groupBy');
	});

	test('groups the values by key, in the order of the first appearance of the key', () => {
		expect(IterableLinq.from([1, 2, 3, 4, 5]).groupBy(v => v % 2).collectToArray()).toEqual([[1, [1, 3, 5]], [0, [2, 4]]]);
	});

	test('chains on the groups', () => {
		const records = [{ group: 'a', score: 1 }, { group: 'b', score: 2 }, { group: 'a', score: 3 }];
		const totals = IterableLinq.from(records)
			.groupBy(record => record.group)
			.map(([group, values]) => [group, values.reduce((total, record) => total + record.score, 0)] as const)
			.collectToArray();
		expect(totals).toEqual([['a', 4], ['b', 2]]);
	});

	test('is a lazy, re-runnable Transformation', () => {
		expectTransformation(source => IterableLinq.from(source).groupBy(v => v % 2));
	});

	test('infers the key and value types', () => {
		expectTypeOf(IterableLinq.from(['a']).groupBy(v => v.length)).toEqualTypeOf<IterableLinq.IIterableLinq<[number, string[]]>>();
	});
});
