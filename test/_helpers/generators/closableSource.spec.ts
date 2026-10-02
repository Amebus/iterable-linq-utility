import { describe, expect, test } from 'vitest';

import { closableSource } from './closableSource';

describe('closableSource', () => {

	test('yields the values on every iteration', () => {
		const { iterable } = closableSource([1, 2, 3]);
		expect(Array.from(iterable)).toEqual([1, 2, 3]);
		expect(Array.from(iterable)).toEqual([1, 2, 3]);
	});

	test('is not closed before it is read, nor while it is read', () => {
		const { state, iterable } = closableSource([1, 2]);
		expect(state.closed).toBe(false);
		iterable[Symbol.iterator]().next();
		expect(state.closed).toBe(false);
	});

	test('is closed by return()', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		const it = iterable[Symbol.iterator]();
		it.next();
		it.return!();
		expect(state.closed).toBe(true);
	});

	test('is closed when a for...of stops early', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		for (const value of iterable) {
			if (value === 1)
				break;
		}
		expect(state.closed).toBe(true);
	});

	test('is closed when it is read to the end', () => {
		const { state, iterable } = closableSource([1]);
		Array.from(iterable);
		expect(state.closed).toBe(true);
	});

});
