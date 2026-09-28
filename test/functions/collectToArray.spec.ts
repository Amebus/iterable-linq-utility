import { describe, expect, test } from 'vitest';
import { expectAction } from '../_helpers/operationKind';

import {
	collectToArray,
	map,
	range
} from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

describe('collectToArray', () => {

	test('collectToArray without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(collectToArray);
	});

	test.each([
		{ input: [1,2,3,4,5,6,7,8,9] },
		{ input: [-1,-2,-3,-4,-5,-6,-7,-8,-9] },
		{ input: [1,2,3,4] },
		{ input: [-3,-5,-8,1,2,3,4] }
	])('collectToArray($input) generates new array', ({ input }) => {
		const arr = collectToArray(input);

		expect(arr).toBeInstanceOf(Array);
		expect(arr).toEqual(input);
		expect(arr).not.toBe(input);
	});

	test.each([
		{ input: 'ciao', expectedArray: Array.from('ciao') },
		{ input: 'Lorem ipsum dolor sit amet', expectedArray: Array.from('Lorem ipsum dolor sit amet') },
	])('collectToArray($input) -> $expectedArray', ({ input, expectedArray }) => {
		const arr = collectToArray(input);

		expect(arr).toBeInstanceOf(Array);
		expect(arr).toEqual(expectedArray);
		expect(arr).not.toBe(expectedArray);
	});

	test.each([
		{ name: 'Set', input: new Set([1, 2, 3]), expected: [1, 2, 3] },
		{ name: 'Map', input: new Map([[1, 'a'], [2, 'b']]), expected: [[1, 'a'], [2, 'b']] },
		{ name: 'generator', input: (function* () { yield 1; yield 2; })(), expected: [1, 2] },
		{ name: 'map', input: map([1, 2, 3], v => v * 2), expected: [2, 4, 6] },
		{ name: 'range', input: range(3), expected: [0, 1, 2] }
	])('collectToArray($name) collects every value', ({ input, expected }) => {
		expect(collectToArray<unknown>(input)).toEqual(expected);
	});

	test('collectToArray of a sparse array fills the holes with undefined, as Array.from', () => {
		// eslint-disable-next-line no-sparse-arrays
		const arr = collectToArray([1, , 3]);

		expect(arr).toEqual([1, undefined, 3]);
		expect(1 in arr).toBe(true);
	});

	test('collectToArray is action', () => {
		expectAction(source => collectToArray(source));
	});

});
