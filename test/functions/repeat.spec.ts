import { describe, expect, test } from 'vitest';

import { 
	collectToArray,
	repeat
} from './_functions';
import { returnClosesTheIterator } from './functionsTestUtility';

describe('repeat', () => {

	test.each([
		{ value: 42, count: 20, returnValue: 'a value' },
		{ value: 42, count: 20, returnValue: 123 },
		{ value: 42, count: 20, returnValue: null },
		{ value: 42, count: 20 }
	])('repeat($value, $count)[Symbol.iterator]().return() closes the iterator', ({ value, count, returnValue }) => {
		const repeatIterable = repeat(value, count);
		returnClosesTheIterator(repeatIterable, returnValue);
	});

	test.each([
		{ value: 'a', count: 0, expectedResult: [] },
		{ value: 'a', count: 5, expectedResult: ['a', 'a', 'a', 'a', 'a'] },
		{ value: '6', count: 5, expectedResult: ['6', '6', '6', '6', '6'] },
		{ value: 42, count: 5, expectedResult: [42, 42, 42, 42, 42] },
		{ value: 42, count: 0, expectedResult: [] },
	])('repeat($value, $count) -> $expectedResult', ({ value, count, expectedResult }) => {
		const r = collectToArray(repeat(value, count));
		expect(r.length).toBe(count);
		expect(r).toEqual(expectedResult);
	});

	test.each([
		{ value: 10, count: -1 },
		{ value: '10', count: -1 },
		{ value: 10, count: -50 },
		{ value: '10', count: -50 },
	])('repeat($value, $count) -> throw exception', ({ value, count }) => {
		expect(() => repeat(value, count)).toThrowError();
	});

});