import { describe, expect, test } from 'vitest';

import * as LinqIterable from '../src';

describe('from', () => {

	test.each([
		{ iterable: 'Lorem ipsum dolor sit amet'}
	])('from($iterable)', ({ iterable }) => {
		const r = LinqIterable.from(iterable);
		expect(r).toBeInstanceOf(LinqIterable.LinqIterableWrapper);
		expect(r['iterable']).toBe(iterable);
		expect([...r].join('')).toEqual(iterable);
	});

	test.each([
		{ iterable: [1,2,3,4,5,6,7,8,9]}
	])('from($iterable)', ({ iterable }) => {
		const r = LinqIterable.from(iterable);
		expect(r).toBeInstanceOf(LinqIterable.LinqIterableWrapper);
		expect(r['iterable']).toBe(iterable);
		expect([...r]).toEqual(iterable);
	});

});