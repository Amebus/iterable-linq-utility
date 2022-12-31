import { describe, expect, test, vi } from 'vitest';

import { 
	collectToArray,
	range,
	tapChain
} from './_functions';
import { unit } from './_types';

describe('tapChain', () => {

	test.each([
		{ end: 10 },
		{ end: 10 },
		{ end: 30 }
	])('tapChain(range($end)) to call taper function 2 times', ({ end }) => {
		const tapperSpy = vi.fn(() => unit());
		const tapped = tapChain(range(end), tapperSpy);
		
		expect(tapperSpy).not.toHaveBeenCalled();
		
		collectToArray(tapped);
		
		expect(tapperSpy).toHaveBeenCalledOnce();

		collectToArray(tapped);

		expect(tapperSpy).toHaveBeenCalledTimes(2);
	});

});