import { describe, expect, test } from 'vitest';

import { 
	collectToArray,
	empty
} from "@/functions";

import { returnClosesTheIterator } from './functionsTestUtility';

describe('empty', () => {

	test('empty() generates an empty array', () => {
		const r = collectToArray(empty<number>());
		expect(r).toEqual([]);
	});

	test.each([
		{ returnValue: 'a value' },
		{ returnValue: 123 },
		{ returnValue: null },
		{ }
	])('empty()[Symbol.iterator]().return() closes the iterator', ({ returnValue }) => {
		returnClosesTheIterator(empty<number>(), returnValue);
	});

	test('same empty() generates new empty array each time', () => {
		const e = empty<number>();

		const r1 = collectToArray(e);
		const r2 = collectToArray(e);
		expect(r1).not.toBe(r2);
		const r3 = collectToArray(e);
		expect(r2).not.toBe(r3);

		expect(r1).toEqual([]);
		expect(r2).toEqual([]);
		expect(r3).toEqual([]);
	});

});