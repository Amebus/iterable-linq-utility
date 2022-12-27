import { describe, expect, test, vi } from "vitest";

import * as IterableLinq from '../../src';

describe('map', () => {

	test.each([
		{ start: 0, end: 5, mapPredicate: v => v * 10 },
		{ start: -5, end: 5, mapPredicate: v => v * 10 },
		{ start: 0, end: 5, mapPredicate: (v, idx) => v * idx },
		{ start: -5, end: 5, mapPredicate: (v, idx) => v * idx }
	])('IterableLinq.fromRange($start, $end).map($mapPredicate) is transformation', ({ start, end, mapPredicate }) => {
		const mapPredicateSpy = vi.fn(mapPredicate);
		const mapped = IterableLinq
			.fromRange(start, end)
			.map(mapPredicateSpy);
		expect(mapPredicateSpy).not.toHaveBeenCalled();
		mapped.collectToArray();
		expect(mapPredicateSpy).toHaveBeenCalled();
	});


	test.each([
		{ start: 0, end: 5, mapPredicate: v => v * 10, expectedPredicateCalls: [5,10,15,20] },
		{ start: -5, end: 5, mapPredicate: v => v * 10, expectedPredicateCalls: [10,20,30,40] },
		{ start: 0, end: 5, mapPredicate: (v, idx) => v * idx, expectedPredicateCalls: [5,10,15,20] },
		{ start: -5, end: 5, mapPredicate: (v, idx) => v * idx, expectedPredicateCalls: [10,20,30,40] }
	])('IterableLinq.fromRange($start, $end).map($mapPredicate) allows re-run', ({ start, end, mapPredicate, expectedPredicateCalls }) => {
		const mapPredicateSpy = vi.fn(mapPredicate);
		const mapped = IterableLinq
			.fromRange(start, end)
			.map(mapPredicateSpy);
		expect(mapPredicateSpy).not.toHaveBeenCalled();

		expectedPredicateCalls
			.forEach(expectedCalls => {
				mapped.collectToArray();
				expect(mapPredicateSpy).toHaveBeenCalledTimes(expectedCalls);
			});
	});



	test.each([
		{ start: 0, end: 5, mapPredicate: v => v * 10, expectedResult: [0,10,20,30,40] },
		{ start: -5, end: 5, mapPredicate: v => v * 10, expectedResult: [-50,-40,-30,-20,-10,0,10,20,30,40] },
		{ start: 0, end: 5, mapPredicate: (v, idx) => v * idx, expectedResult: [0,1,4,9,16] },
		{ start: -5, end: 5, mapPredicate: (v, idx) => v * idx, expectedResult: [-0, -4, -6, -6, -4, 0, 6, 14, 24, 36] }
	])('IterableLinq.fromRange($start, $end).map($mapPredicate) -> $expectedResult', ({ start, end, mapPredicate, expectedResult }) => {
		const r = IterableLinq
			.fromRange(start, end)
			.map(mapPredicate)
			.collectToArray();
		expect(r).toEqual(expectedResult);
	});

});