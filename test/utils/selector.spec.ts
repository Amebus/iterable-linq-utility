import { describe, expect, test } from 'vitest';

import { isPropertyKey } from '@/utils';

describe('selector', () => {

	describe('isPropertyKey', () => {
		test.each(['a', '', 0, 1.5, NaN, Symbol('s')])('accepts %s', value => {
			expect(isPropertyKey(value)).toBe(true);
		});

		test.each([undefined, null, {}, true, () => 1, BigInt(10)])('rejects %s', value => {
			expect(isPropertyKey(value)).toBe(false);
		});
	});

});
