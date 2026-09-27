import { describe, expect, test, vi } from 'vitest';

import * as IterableLinq from '@/index';
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
		expect(r.collectToArray().join('')).toEqual(iterable);
	});

	test.each([
		{ iterable: [1,2,3,4,5,6,7,8,9] }
	])('IterableLinq.from($iterable)', ({ iterable }) => {
		const r = IterableLinq.from(iterable);
		expect(r).toBeInstanceOf(IterableLinq.IterableLinqWrapper);
		expect(r.collectToArray()).toEqual(iterable);
	});

	test('IterableLinq.from does not copy the source', () => {
		const values = [1, 2, 3];
		const source = { [Symbol.iterator]: vi.fn(() => values[Symbol.iterator]()) };
		const r = IterableLinq.from(source);
		expect(source[Symbol.iterator]).not.toHaveBeenCalled();
		values.push(4);
		expect(r.collectToArray()).toEqual([1, 2, 3, 4]);
		expect(source[Symbol.iterator]).toHaveBeenCalledTimes(1);
	});

});
