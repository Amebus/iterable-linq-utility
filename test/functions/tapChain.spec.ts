import { describe, expect, test, vi } from 'vitest';

import { 
	range,
	tapChain
} from './_functions';

describe('tapChain', () => {

	test.each([
		{ end: 10 },
		{ end: 10 },
		{ end: 30 }
	])('tapChain(range($end)) to call taper function 2 times', ({ end }) => {
		const tapperSpy = vi.fn(() => {
			// just an ampty function
			// we just need to check with the spy
		});
		const tapped = tapChain(range(end), tapperSpy);
		
		expect(tapperSpy).not.toHaveBeenCalled();
		
		[...tapped];
		
		expect(tapperSpy).toHaveBeenCalledOnce();

		[...tapped];

		expect(tapperSpy).toHaveBeenCalledTimes(2);
	});

});