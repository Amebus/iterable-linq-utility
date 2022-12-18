import { describe, expect, test, vi } from 'vitest';

import * as IterableLinq from '../../src';

describe('IterableLinq.tapChain', () => {

	test.each([
		{ end: 10 },
		{ end: 10 },
		{ end: 30 }
	])('IterableLinq.fromRange($end).tapChain() to call taper function 2 times', ({ end }) => {
		const tapperSpy = vi.fn(() => {
			// just an ampty function
			// we just need to check with the spy
		});
		const tapped = IterableLinq
			.fromRange(end)
			.tapChain(tapperSpy);
		
		expect(tapperSpy).not.toHaveBeenCalled();
		
		tapped.collectToArray();
		
		expect(tapperSpy).toHaveBeenCalledOnce();

		tapped.collectToArray();

		expect(tapperSpy).toHaveBeenCalledTimes(2);
	});

});