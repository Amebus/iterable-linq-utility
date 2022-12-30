import { describe, expect, test, vi } from 'vitest';

import { 
	collectToArray,
	flatMap,
	range
} from './_functions';

import { returnClosesTheIterator, withoutInputIterableThrowsException } from './functionsTestUtility';

const loremIpsum = 'Lorem ipsum dolor sit amte';

describe('flatMap', () => {

	test('flatMap without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(flatMap);
	});

	test.each([
		{ start: 0, end: 20 },
		{ start: -10, end: 10 },
		{ start: 0, end: 20, mapper: undefined },
		{ start: 0, end: 20, mapper: null },
		{ start: 0, end: 20, mapper: {} }
	])('flatMap without mapper -> throw exception', ({ start, end, mapper }) => {
		const flatMapJs = flatMap as any;
		expect(() => flatMapJs(range(start, end))).toThrowError();
		expect(() => flatMapJs(range(start, end), mapper)).toThrowError();
	});

	test.each([
		{ start: 0, end: 20, mapPredicate: v => range(v), returnValue: 'a value' },
		{ start: 0, end: 20, mapPredicate: v => range(v), returnValue: 123 },
		{ start: 0, end: 20, mapPredicate: v => range(v), returnValue: null },
		{ start: 0, end: 20, mapPredicate: v => range(v) }
	])('flatMap(range($start, $end), $mapPredicate)[Symbol.iterator]().return() closes the iterator', ({ start, end, mapPredicate, returnValue }) => {
		const flatMapIterable = flatMap(range(start, end), mapPredicate);
		returnClosesTheIterator(flatMapIterable, returnValue);
	});

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
