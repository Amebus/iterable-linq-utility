import { describe, expect, test, vi } from 'vitest';

import { IterableLinq } from './_linqIterable';
import { unit } from './_types';

describe('IterableLinq.tap', () => {

	test.each([
		{ end: 10, expectedTappedValue: -1 },
		{ end: 10, expectedTappedValue: 5 },
		{ end: 30, expectedTappedValue: 25 }
	])('IterableLinq.fromRange($end).tap() to save $expectedTappedValue from tap', ({ end, expectedTappedValue }) => {
		const tapperSpy = vi.fn(v => {
			if (v === expectedTappedValue)
				tappedValue = expectedTappedValue;
			return unit();
		});
		let tappedValue = -1;
		const tapped = IterableLinq
			.fromRange(end)
			.tap(tapperSpy);
		
		expect(tapperSpy).not.toHaveBeenCalled();
		
		tapped.collectToArray();
		expect(tappedValue).toBe(expectedTappedValue);
		expect(tapperSpy).toHaveReturnedTimes(end);
	});

});