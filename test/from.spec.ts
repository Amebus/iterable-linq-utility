import { describe, expect, test } from 'vitest';

import { IterableLinq } from './_linqIterable';
import { withoutInputIterableThrowsException } from './functions/functionsTestUtility';

describe('IterableLinq.from', () => {

	test('IterableLinq.from without iterable -> throw exception', () => {
		withoutInputIterableThrowsException(IterableLinq.from);
	});

	test.each([
		{ iterable: 'Lorem ipsum dolor sit amet' }
	])('IterableLinq.from($iterable)', ({ iterable }) => {
		const r = IterableLinq.from(iterable);
		expect(r).toBeInstanceOf(IterableLinq.IterableLinqWrapper);
		expect(r['iterable']).toBe(iterable);
		expect(r.collectToArray().join('')).toEqual(iterable);
	});

	test.each([
		{ iterable: [1,2,3,4,5,6,7,8,9] }
	])('IterableLinq.from($iterable)', ({ iterable }) => {
		const r = IterableLinq.from(iterable);
		expect(r).toBeInstanceOf(IterableLinq.IterableLinqWrapper);
		expect(r['iterable']).toBe(iterable);
		expect(r.collectToArray()).toEqual(iterable);
	});

});