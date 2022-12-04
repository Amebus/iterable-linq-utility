import { describe, expect, test } from "vitest";

import * as LinqIterable from '../src';

describe('collectToArray', () => {

	test.each([
		{input: [1,2,3,4,5,6,7,8,9]},
		{input: [-1,-2,-3,-4,-5,-6,-7,-8,-9]},
		{input: [1,2,3,4]},
		{input: [-3,-5,-8,1,2,3,4]},
	])('linqIterable($input).collectToArray()', ({input}) => {
		const stream = LinqIterable.from(input);

		expect(stream).not.toBeInstanceOf(Array);

		const r = stream.collectToArray();
		expect(r).toBeInstanceOf(Array);
		expect(r).toEqual(input);
		expect(r).not.toBe(input);
	});

});
