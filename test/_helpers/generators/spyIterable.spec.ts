import { describe, expect, test } from 'vitest';

import { spyIterable } from './spyIterable';

describe('spyIterable', () => {

	test('counts iterations and reads', () => {
		const spy = spyIterable([1, 2, 3]);
		expect(spy.stats).toEqual({ iterations: 0, reads: 0 });

		expect(Array.from(spy)).toEqual([1, 2, 3]);
		expect(spy.stats).toEqual({ iterations: 1, reads: 3 });

		Array.from(spy);
		expect(spy.stats).toEqual({ iterations: 2, reads: 6 });
	});

	test('counts only the values read', () => {
		const spy = spyIterable([1, 2, 3]);
		spy[Symbol.iterator]().next();
		expect(spy.stats).toEqual({ iterations: 1, reads: 1 });
	});

});
