import { describe, expect, test, vi } from 'vitest';

import { 
	collectToArray,
	flatMap,
	range
} from "@/functions";

const loremIpsum = 'Lorem ipsum dolor sit amte';

describe('flatMap', () => {

	test.each([
		{ start: 0, end: 3, mapPredicate: v => range(v) },
		{ start: 1, end: 4, mapPredicate: v => range(v) },
		{ start: 1, end: 4, mapPredicate: (v, idx) => range(idx) },
		{ start: 1, end: 5, mapPredicate: (v, idx) => range(idx) },
		{ start: 1, end: 5, mapPredicate: v => loremIpsum.substring(0, v) },
	])('flatMap(range($start, $end), $mapPredicate) is transformation', ({ start, end, mapPredicate }) => {
		const mapPredicateSpy = vi.fn(mapPredicate as any);
		const mapped = flatMap<number, number | string>(range(start, end), mapPredicateSpy);
		expect(mapPredicateSpy).not.toHaveBeenCalled();
		collectToArray(mapped);
		expect(mapPredicateSpy).toHaveReturned();
	});

	test.each([
		{ start: 0, end: 3, mapPredicate: v => range(v), expectedPredicateCalls: [3,6,9,12] },
		{ start: 1, end: 4, mapPredicate: v => range(v), expectedPredicateCalls: [3,6,9,12] },
		{ start: 1, end: 4, mapPredicate: (v, idx) => range(idx), expectedPredicateCalls: [3,6,9,12] },
		{ start: 1, end: 5, mapPredicate: (v, idx) => range(idx), expectedPredicateCalls: [4,8,12,16] },
		{ start: 1, end: 5, mapPredicate: v => loremIpsum.substring(0, v), expectedPredicateCalls: [4,8,12,16] }
	])('flatMap(range($start, $end), $mapPredicate) allows re-run', ({ start, end, mapPredicate, expectedPredicateCalls }) => {
		const mapPredicateSpy = vi.fn(mapPredicate as any);
		const mapped = flatMap<number, number | string>(range(start, end), mapPredicateSpy);
		expect(mapPredicateSpy).not.toHaveReturned();

		expectedPredicateCalls
			.forEach(expectedCalls => {
				collectToArray(mapped);
				expect(mapPredicateSpy).toHaveReturnedTimes(expectedCalls);
			});
	});

	test.each([
		{ start: 0, end: 3, mapPredicate: v => range(v), expectedResult: [0,0,1] },
		{ start: 1, end: 4, mapPredicate: v => range(v), expectedResult: [0,0,1,0,1,2] },
		{ start: 1, end: 4, mapPredicate: (v, idx) => range(idx), expectedResult: [0,0,1] },
		{ start: 1, end: 5, mapPredicate: (v, idx) => range(idx), expectedResult: [0,0,1,0,1,2] },
		{ start: 1, end: 5, mapPredicate: v => loremIpsum.substring(0, v), expectedResult: ['L', 'L', 'o', 'L', 'o', 'r', 'L', 'o', 'r', 'e' ] },
	])('flatMap(range($start, $end), $mapPredicate) -> $expectedResult', ({ start, end, mapPredicate, expectedResult }) => {
		const r = collectToArray(flatMap<number, number | string>(range(start, end), mapPredicate));
		expect(r).toEqual(expectedResult);
	});

});
