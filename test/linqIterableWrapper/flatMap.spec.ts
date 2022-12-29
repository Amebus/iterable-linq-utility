import { describe, expect, test, vi } from 'vitest';

import * as IterableLinq from '../../src';
import { withoutInputFunctionThrowsException } from './linqIterableWrapperTestUtility';

const loremIpsum = 'Lorem ipsum dolor sit amte';

describe('IterableLinq.flatMap', () => {

	test.each([
		{ start: 0, end: 20 },
		{ start: -10, end: 10 }
	])('IterableLinq.flatMap without mapper -> throw exception', ({ start, end }) => {
		withoutInputFunctionThrowsException(IterableLinq.fromRange(start, end), 'flatMap');
	});

	test.each([
		{ start: 0, end: 3, mapPredicate: v => IterableLinq.fromRange(v) },
		{ start: 1, end: 4, mapPredicate: v => IterableLinq.fromRange(v) },
		{ start: 1, end: 4, mapPredicate: (v, idx) => IterableLinq.fromRange(idx) },
		{ start: 1, end: 5, mapPredicate: (v, idx) => IterableLinq.fromRange(idx) },
		{ start: 1, end: 5, mapPredicate: v => loremIpsum.substring(0, v) },
	])('IterableLinq.fromRange($start, $end).flatMap($mapPredicate) is transformation', ({ start, end, mapPredicate }) => {
		const mapPredicateSpy = vi.fn(mapPredicate as any);
		const mapped = IterableLinq
			.fromRange(start, end)
			.flatMap<number | string>(mapPredicateSpy);
		expect(mapPredicateSpy).not.toHaveBeenCalled();
		mapped.collectToArray();
		expect(mapPredicateSpy).toHaveReturned();
	});

	test.each([
		{ start: 0, end: 3, mapPredicate: v => IterableLinq.fromRange(v), expectedPredicateCalls: [3,6,9,12] },
		{ start: 1, end: 4, mapPredicate: v => IterableLinq.fromRange(v), expectedPredicateCalls: [3,6,9,12] },
		{ start: 1, end: 4, mapPredicate: (v, idx) => IterableLinq.fromRange(idx), expectedPredicateCalls: [3,6,9,12] },
		{ start: 1, end: 5, mapPredicate: (v, idx) => IterableLinq.fromRange(idx), expectedPredicateCalls: [4,8,12,16] },
		{ start: 1, end: 5, mapPredicate: v => loremIpsum.substring(0, v), expectedPredicateCalls: [4,8,12,16] }
	])('IterableLinq.fromRange($start, $end).flatMap($mapPredicate) allows re-run', ({ start, end, mapPredicate, expectedPredicateCalls }) => {
		const mapPredicateSpy = vi.fn(mapPredicate as any);
		const mapped = IterableLinq
			.fromRange(start, end)
			.flatMap<number | string>(mapPredicateSpy);
		expect(mapPredicateSpy).not.toHaveReturned();

		expectedPredicateCalls
			.forEach(expectedCalls => {
				mapped.collectToArray();
				expect(mapPredicateSpy).toHaveReturnedTimes(expectedCalls);
			});
	});

	test.each([
		{ start: 0, end: 3, mapPredicate: v => IterableLinq.fromRange(v), expectedResult: [0,0,1] },
		{ start: 1, end: 4, mapPredicate: v => IterableLinq.fromRange(v), expectedResult: [0,0,1,0,1,2] },
		{ start: 1, end: 4, mapPredicate: (v, idx) => IterableLinq.fromRange(idx), expectedResult: [0,0,1] },
		{ start: 1, end: 5, mapPredicate: (v, idx) => IterableLinq.fromRange(idx), expectedResult: [0,0,1,0,1,2] },
		{ start: 1, end: 5, mapPredicate: v => loremIpsum.substring(0, v), expectedResult: ['L', 'L', 'o', 'L', 'o', 'r', 'L', 'o', 'r', 'e' ] },
	])('IterableLinq.fromRange($start, $end).flatMap($mapPredicate) -> $expectedResult', ({ start, end, mapPredicate, expectedResult }) => {
		const r = IterableLinq
			.fromRange(start,end)
			.flatMap<number | string>(mapPredicate)
			.collectToArray();
		expect(r).toEqual(expectedResult);
	});

});
