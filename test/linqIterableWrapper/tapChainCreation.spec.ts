import { describe, expect, test, vi } from 'vitest';

import * as IterableLinq from '../../src';

describe('IterableLinq.tapChainCreation', () => {

	test.each([
		{ end: 10 },
		{ end: 10 },
		{ end: 30 }
	])('IterableLinq.fromRange($end).tapChainCreation() to being hit 2 times', ({ end }) => {
		const chainCreationTapperSpy = vi.fn(() => {
			// just an ampty function
			// we just need to check with the spy
		});
		const tapped = IterableLinq
			.fromRange(end)
			.tapChainCreation(chainCreationTapperSpy)
			.tap(() => {
				// just an empty function
			})
			.tapChainCreation(chainCreationTapperSpy);
		
		expect(chainCreationTapperSpy).toHaveBeenCalledTimes(2);
		[...tapped];
		expect(chainCreationTapperSpy).toHaveBeenCalledTimes(2);
	});

});