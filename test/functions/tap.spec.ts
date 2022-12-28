import { describe, expect, test, vi } from 'vitest';

import { 
	range,
	tap
} from '@/functions';
import { returnClosesTheIterator } from './functionsTestUtility';

describe('tap', () => {

	test.each([
		{ end: 20, returnValue: 'a value' },
		{ end: 20, returnValue: 123 },
		{ end: 20, returnValue: null },
		{ end: 20 }
	])('repeat($value, $count)[Symbol.iterator]().return() closes the iterator', ({ end, returnValue }) => {
		const repeatIterable = tap(range(end), () => {
			// empty is ok
		});
		returnClosesTheIterator(repeatIterable, returnValue);
	});

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