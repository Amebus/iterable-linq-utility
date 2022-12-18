import { describe, expect, test, vi } from "vitest";

import * as IterableLinq from '../../src';

describe('IterableLinq.filter', () => {

	test.each([
		{ start: 0, end: 20, filterPredicate: v => v % 2 === 0, expectedResult: [0,2,4,6,8,10,12,14,16,18] },
		{ start: 0, end: 20, filterPredicate: v => v % 2 === 1, expectedResult: [1,3,5,7,9,11,13,15,17,19] },
		{ start: -10, end: 10, filterPredicate: v => v > -5 && v < 5, expectedResult: [-4,-3,-2,-1,0,1,2,3,4] },
		{ start: 0, end: 20, filterPredicate: (v, idx) => v % 2 === 0 && idx < 10, expectedResult: [0,2,4,6,8] },
		{ start: 0, end: 20, filterPredicate: (v, idx) => v % 2 === 1 && idx > 10, expectedResult: [11,13,15,17,19] },
		{ start: -10, end: 10, filterPredicate: (v, idx) => v > -5 && v < 5 && idx === 0, expectedResult: [] }
	])('IterableLinq.fromRange($start, $end).filter($filterPredicate) -> $expectedResult', ({ start, end, filterPredicate, expectedResult }) => {
		const r = IterableLinq
			.fromRange(start, end)
			.filter(filterPredicate)
			.collectToArray();
		expect(r).toEqual(expectedResult);
	});

	test.each([
		{ start: 0, end: 20, filterPredicate: v => v % 2 === 0, expectedPredicateCalls: 20 },
		{ start: 0, end: 20, filterPredicate: v => v % 2 === 1, expectedPredicateCalls: 20 },
		{ start: -10, end: 10, filterPredicate: v => v > -5 && v < 5, expectedPredicateCalls: 20 },
		{ start: 0, end: 20, filterPredicate: (v, idx) => v % 2 === 0 && idx < 10, expectedPredicateCalls: 20 },
		{ start: 0, end: 20, filterPredicate: (v, idx) => v % 2 === 1 && idx > 10, expectedPredicateCalls: 20 },
		{ start: -10, end: 10, filterPredicate: (v, idx) => v > -5 && v < 5 && idx === 0, expectedPredicateCalls: 20 }
	])('IterableLinq.fromRange($start, $end).filter($filterPredicate) is transformation', ({ start, end, filterPredicate, expectedPredicateCalls }) => {
		const filterPredicateSpy = vi.fn(filterPredicate);
		const filtered = IterableLinq
			.fromRange(start, end)
			.filter(filterPredicateSpy);
		expect(filterPredicateSpy).not.toHaveBeenCalled();
		filtered.collectToArray();
		expect(filterPredicateSpy).toHaveBeenCalledTimes(expectedPredicateCalls);
	});

});