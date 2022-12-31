import { describe, expect, test, vi } from 'vitest';

import { IterableLinq } from './_linqIterable';
import { unit } from './_types';

describe('IterableLinq.tapChain', () => {

	test.each([
		{ end: 10 },
		{ end: 10 },
		{ end: 30 }
	])('IterableLinq.fromRange($end).tapChain() to call taper function 2 times', ({ end }) => {
		const tapperSpy = vi.fn(() => unit());
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