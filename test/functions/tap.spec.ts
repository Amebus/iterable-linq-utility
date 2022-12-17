import { describe, expect, test, vi } from 'vitest';

import { 
	range,
	tap
} from '@/functions';

describe('tap', () => {

	test.each([
		{ end: 10, expectedTappedValue: -1 },
		{ end: 10, expectedTappedValue: 5 },
		{ end: 30, expectedTappedValue: 25 }
	])('tap(range($end)) to save $expectedTappedValue from tap', ({ end, expectedTappedValue }) => {
		const tapperSpy = vi.fn(v => {
			if (v === expectedTappedValue)
				tappedValue = expectedTappedValue;
		});
		let tappedValue = -1;
		const tapped = tap(range(end), tapperSpy);
		
		expect(tapperSpy).not.toHaveBeenCalled();
		
		[...tapped];
		expect(tappedValue).toBe(expectedTappedValue);
		expect(tapperSpy).toHaveBeenCalledTimes(end);
	});

	test.each([
		{ end: 10, expectedTappedValue: -1 },
		{ end: 10, expectedTappedValue: 5 },
		{ end: 30, expectedTappedValue: 25 }
	])('tap(range($end)) to save $expectedTappedValue from tap', ({ end, expectedTappedValue }) => {
		const tapperSpy = vi.fn((v, idx) => {
			if (idx === expectedTappedValue)
				tappedValue = v;
		});
		let tappedValue = -1;
		const tapped = tap(range(end), tapperSpy);
		
		expect(tapperSpy).not.toHaveBeenCalled();
		
		[...tapped];
		expect(tappedValue).toBe(expectedTappedValue);
		expect(tapperSpy).toHaveBeenCalledTimes(end);
	});

});