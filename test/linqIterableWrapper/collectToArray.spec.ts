import { describe, expect, test } from 'vitest';

import * as IterableLinq from '../../src';

describe('IterableLinq.collectToArray', () => {

	test.each([
		{ input: [1,2,3,4,5,6,7,8,9] },
		{ input: [-1,-2,-3,-4,-5,-6,-7,-8,-9] },
		{ input: [1,2,3,4] },
		{ input: [-3,-5,-8,1,2,3,4] },
	])('IterableLinq.from($input).collectToArray() generates new array', ({ input }) => {
		const stream = IterableLinq.from(input);

		expect(stream).not.toBeInstanceOf(Array);

		const r = stream.collectToArray();
		expect(r).toBeInstanceOf(Array);
		expect(r).toEqual(input);
		expect(r).not.toBe(input);
	});

	test.each([
		{ input: 'ciao', expectedArray: Array.from('ciao') },
		{ input: 'Lorem ipsum dolor sit amet', expectedArray: Array.from('Lorem ipsum dolor sit amet') },
	])('IterableLinq.from($input).collectToArray() -> $expectedArray', ({ input, expectedArray }) => {
		const stream = IterableLinq.from(input);

		expect(stream).not.toBeInstanceOf(Array);

		const r = stream.collectToArray();
		expect(r).toBeInstanceOf(Array);
		expect(r).toEqual(expectedArray);
		expect(r).not.toBe(expectedArray);
	});

});
