import { describe, expect, test, vi } from 'vitest';

import * as IterableLinq from '../src';


describe('IterableLinq.repeat', () => {

	test.each([
		{ value: 'a', count: 0, expectedResult: [] },
		{ value: 'a', count: 5, expectedResult: ['a', 'a', 'a', 'a', 'a'] },
		{ value: '6', count: 5, expectedResult: ['6', '6', '6', '6', '6'] },
		{ value: 42, count: 5, expectedResult: [42, 42, 42, 42, 42] },
		{ value: 42, count: 0, expectedResult: [] },
	])('IterableLinq.repeat($value, $count).collectToArray() -> $expectedResult', ({ value, count, expectedResult }) => {
		const r = IterableLinq
			.repeat(value, count)
			.collectToArray();
		expect(r.length).toBe(count);
		expect(r).toEqual(expectedResult);
	});

	test.each([
		{ value: 10, count: -1 },
		{ value: '10', count: -1 },
		{ value: 10, count: -50 },
		{ value: '10', count: -50 },
	])('IterableLinq.repeat($value, $count) -> throw exception', ({ value, count }) => {
		expect(() => IterableLinq.repeat(value, count)).toThrowError();
	});

});