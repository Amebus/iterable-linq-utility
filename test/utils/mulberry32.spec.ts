import { describe, expect, test } from 'vitest';

import { mulberry32 } from '@/utils';

describe('mulberry32', () => {

	test('the values of a seed never change', () => {
		const next = mulberry32(42);
		expect([next(), next(), next()]).toEqual([0.6011037519201636, 0.44829055899754167, 0.8524657934904099]);
	});

	test('uses 32 bits of the seed', () => {
		const a = mulberry32(0);
		const b = mulberry32(2 ** 32);
		expect([a(), a()]).toEqual([b(), b()]);
		expect(a()).toBe(b());
	});

	test('a negative seed works', () => {
		expect(mulberry32(-1)()).toBe(0.8964226141106337);
	});

	test('every value is in [0, 1)', () => {
		const next = mulberry32(1);
		for (let i = 0; i < 10_000; i++) {
			const value = next();
			expect(value >= 0 && value < 1).toBe(true);
		}
	});

	test('each generator has its own state', () => {
		const a = mulberry32(1);
		const first = a();
		expect(mulberry32(1)()).toBe(first);
		expect(a()).not.toBe(first);
	});

});
