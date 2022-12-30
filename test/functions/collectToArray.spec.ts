import { describe, expect, test } from 'vitest';

import { 
	collectToArray
} from './_functions';
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

});
