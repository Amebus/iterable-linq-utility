import { describe, expect, expectTypeOf, test } from 'vitest';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectAction } from '../_helpers/operationKind';

import {
	collectToSet,
	range
} from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

describe('collectToSet', () => {

	test('collectToSet without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(collectToSet);
	});

	test.each([
		{ input: [], expectedResult: [] },
		{ input: [1, 2, 3], expectedResult: [1, 2, 3] },
		{ input: [3, 1, 3, 2, 1], expectedResult: [3, 1, 2] },
		{ input: 'ciao ciao', expectedResult: ['c', 'i', 'a', 'o', ' '] }
	])('collectToSet($input) -> $expectedResult', ({ input, expectedResult }) => {
		const set = collectToSet<unknown>(input);
		expect(set).toBeInstanceOf(Set);
		expect([...set]).toEqual(expectedResult);
	});

	test('the values are compared with SameValueZero', () => {
		expect([...collectToSet([NaN, NaN, 0, -0])]).toEqual([NaN, 0]);
		const a = { id: 1 };
		expect(collectToSet([a, a, { id: 1 }]).size).toBe(2);
	});

	test('collectToSet returns a new Set for a Set source', () => {
		const source = new Set([1, 2]);
		const set = collectToSet(source);
		expect(set).not.toBe(source);
		expect([...set]).toEqual([1, 2]);
	});

	test('collectToSet(range(5)) reads the whole source', () => {
		expect([...collectToSet(range(5))]).toEqual([0, 1, 2, 3, 4]);
	});

	test('collectToSet is action', () => {
		expectAction(source => collectToSet(source));
	});

	test('an error of the source propagates', () => {
		const error = new Error('source');
		const { iterable } = throwingSource(3, error);
		expect(() => collectToSet(iterable)).toThrow(error);
	});

	test('the return type is a Set of the values', () => {
		expectTypeOf(collectToSet([1, 2])).toEqualTypeOf<Set<number>>();
	});

});
