import { describe, expect, test, vi } from 'vitest';
import { closableSource } from '../_helpers/closableSource';
import { expectTransformation } from '../_helpers/operationKind';

import {
	collectToArray,
	map,
	range
} from './_functions';
import { returnClosesTheIterator, withoutInputIterableThrowsException } from './functionsTestUtility';

describe('map', () => {

	test('map without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(map);
	});

	test.each([
		{ start: 0, end: 20 },
		{ start: -10, end: 10 },
		{ start: 0, end: 20, mapper: undefined },
		{ start: 0, end: 20, mapper: null },
		{ start: 0, end: 20, mapper: {} }
	])('map without mapper -> throw exception', ({ start, end, mapper }) => {
		const mapJs = map as any;
		expect(() => mapJs(range(start, end))).toThrowError();
		expect(() => mapJs(range(start, end), mapper)).toThrowError();
	});

	test.each([
		{ start: 0, end: 20, mapPredicate: v => range(v), returnValue: 'a value' },
		{ start: 0, end: 20, mapPredicate: v => range(v), returnValue: 123 },
		{ start: 0, end: 20, mapPredicate: v => range(v), returnValue: null },
		{ start: 0, end: 20, mapPredicate: v => range(v) }
	])('map(range($start, $end), $mapPredicate)[Symbol.iterator]().return() closes the iterator', ({ start, end, mapPredicate, returnValue }) => {
		const mapIterable = map(range(start, end), mapPredicate);
		returnClosesTheIterator(mapIterable, returnValue);
	});

	test.each([
		{ start: 0, end: 5, mapPredicate: v => v * 10, expectedPredicateCalls: [5,10,15,20] },
		{ start: -5, end: 5, mapPredicate: v => v * 10, expectedPredicateCalls: [10,20,30,40] },
		{ start: 0, end: 5, mapPredicate: (v, idx) => v * idx, expectedPredicateCalls: [5,10,15,20] },
		{ start: -5, end: 5, mapPredicate: (v, idx) => v * idx, expectedPredicateCalls: [10,20,30,40] }
	])('map(range($start, $end), $mapPredicate) allows re-run', ({ start, end, mapPredicate, expectedPredicateCalls }) => {
		const mapPredicateSpy = vi.fn(mapPredicate);
		const mapped = map(range(start, end), mapPredicateSpy);
		expect(mapPredicateSpy).not.toHaveReturned();

		expectedPredicateCalls
			.forEach(expectedCalls => {
				collectToArray(mapped);
				expect(mapPredicateSpy).toHaveReturnedTimes(expectedCalls);
			});
	});

	test.each([
		{ start: 0, end: 5, mapPredicate: v => v * 10, expectedResult: [0,10,20,30,40] },
		{ start: -5, end: 5, mapPredicate: v => v * 10, expectedResult: [-50,-40,-30,-20,-10,0,10,20,30,40] },
		{ start: 0, end: 5, mapPredicate: (v, idx) => v * idx, expectedResult: [0,1,4,9,16] },
		{ start: -5, end: 5, mapPredicate: (v, idx) => v * idx, expectedResult: [-0, -4, -6, -6, -4, 0, 6, 14, 24, 36] }
	])('map(range($start, $end), $mapPredicate) -> $expectedResult', ({ start, end, mapPredicate, expectedResult }) => {
		const r = collectToArray(map(range(start, end), mapPredicate));
		expect(r).toEqual(expectedResult);
	});

	test('map is transformation', () => {
		expectTransformation(source => map(source, v => v * 10));
	});

	test('return() closes the source', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		const it = map(iterable, v => v)[Symbol.iterator]();
		it.next();
		it.return!();
		expect(state.closed).toBe(true);
	});

	test('a throwing mapper propagates the same error', () => {
		const err = new Error('boom');
		expect(() => collectToArray(map([1], () => { throw err; }))).toThrow(err);
	});

});
