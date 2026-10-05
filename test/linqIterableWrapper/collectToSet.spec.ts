import { describe, expect, test } from 'vitest';
import { expectAction } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('IterableLinq.collectToSet', () => {

	test.each([
		{ input: [], expectedResult: [] },
		{ input: [3, 1, 3, 2, 1], expectedResult: [3, 1, 2] }
	])('IterableLinq.from($input).collectToSet() -> $expectedResult', ({ input, expectedResult }) => {
		const set = IterableLinq.from(input).collectToSet();
		expect(set).toBeInstanceOf(Set);
		expect([...set]).toEqual(expectedResult);
	});

	test('IterableLinq.collectToSet composes with the other operations', () => {
		const set = IterableLinq
			.fromRange(10)
			.map(v => v % 3)
			.collectToSet();
		expect([...set]).toEqual([0, 1, 2]);
	});

	test('IterableLinq.collectToSet is action', () => {
		expectAction(source => IterableLinq.from(source).collectToSet());
	});

});
