import { describe, expect, test, vi } from 'vitest';
import { expectTransformation } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('IterableLinq.shuffle', () => {

	test('IterableLinq.shuffle is transformation', () => {
		expectTransformation(source => IterableLinq.from(source).shuffle());
	});

	test('IterableLinq.fromRange(10).shuffle({ seed: 42 }) gives the order of the seed', () => {
		expect(IterableLinq.fromRange(10).shuffle({ seed: 42 }).collectToArray()).toEqual([6, 5, 8, 7, 1, 3, 4, 2, 9, 0]);
	});

	test('IterableLinq.shuffle passes the seed to random', () => {
		const random = vi.fn((seed: string) => () => seed.length / 10);
		IterableLinq.fromRange(3).shuffle({ seed: 'abc', random }).collectToArray();
		expect(random).toHaveBeenCalledWith('abc');
	});

	test('IterableLinq.shuffle with take gives the first values of the order', () => {
		expect(IterableLinq.fromRange(10).shuffle({ seed: 42 }).take(3).collectToArray()).toEqual([6, 5, 8]);
	});

	test('IterableLinq.shuffle with a seed, after a map, repeats the order when the chain is read again', () => {
		const chain = IterableLinq.fromRange(10).map(v => v).shuffle({ seed: 42 });
		expect(chain.take(3).collectToArray()).toEqual([6, 5, 8]);
		expect(chain.collectToArray()).toEqual([6, 5, 8, 7, 1, 3, 4, 2, 9, 0]);
		expect(chain.collectToArray()).toEqual([6, 5, 8, 7, 1, 3, 4, 2, 9, 0]);
	});

	test('IterableLinq.shuffle validates the seed', () => {
		expect(() => IterableLinq.fromRange(10).shuffle({ seed: 1.5 }))
			.toThrow(new Error('[iterable-linq-utility/shuffle] The "seed" parameter must be an integer'));
	});

});
