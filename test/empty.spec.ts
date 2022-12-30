import { describe, expect, test } from 'vitest';

import { IterableLinq } from './_linqIterable';

describe('IterableLinq.empty', () => {

	test('IterableLinq.empty() generates an empty array', () => {
		const r = IterableLinq
			.empty<number>()
			.collectToArray();

		expect(r).toEqual([]);

	});

	test('same IterableLinq.empty() generates new empty array each time', () => {
		const e = IterableLinq.empty<number>();

		const r1 = e.collectToArray();
		const r2 = e.collectToArray();
		expect(r1).not.toBe(r2);
		const r3 = e.collectToArray();
		expect(r2).not.toBe(r3);

		expect(r1).toEqual([]);
		expect(r2).toEqual([]);
		expect(r3).toEqual([]);

	});

});