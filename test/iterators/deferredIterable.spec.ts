import { describe, expect, test, vi } from 'vitest';

import { DeferredIterable } from '../../src/iterators';

describe('DeferredIterable', () => {

	test('creates a fresh iterator per call', () => {
		const factory = vi.fn(() => [1, 2][Symbol.iterator]());
		const deferred = new DeferredIterable(factory);
		expect(factory).not.toHaveBeenCalled();
		const a = deferred[Symbol.iterator]();
		const b = deferred[Symbol.iterator]();
		expect(factory).toHaveBeenCalledTimes(2);
		expect(a).not.toBe(b);
	});

	test('re-runnable', () => {
		const deferred = new DeferredIterable(() => [1, 2][Symbol.iterator]());
		expect([...deferred]).toEqual([1, 2]);
		expect([...deferred]).toEqual([1, 2]);
	});

});
