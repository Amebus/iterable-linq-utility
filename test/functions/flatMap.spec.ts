import { describe, expect, test, vi } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { expectTransformation } from '../_helpers/operationKind';

import {
	collectToArray,
	flatMap,
	range
} from '@/functions';
import type { Mapper } from '@/types';
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
		expect(() => flatMapJs(range(start, end))).toThrow();
		expect(() => flatMapJs(range(start, end), mapper)).toThrow();
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
		{ start: 0, end: 3, mapPredicate: v => range(v), expectedPredicateCalls: [3,6,9,12] },
		{ start: 1, end: 4, mapPredicate: v => range(v), expectedPredicateCalls: [3,6,9,12] },
		{ start: 1, end: 4, mapPredicate: (_v, idx) => range(idx), expectedPredicateCalls: [3,6,9,12] },
		{ start: 1, end: 5, mapPredicate: (_v, idx) => range(idx), expectedPredicateCalls: [4,8,12,16] },
		{ start: 1, end: 5, mapPredicate: v => loremIpsum.substring(0, v), expectedPredicateCalls: [4,8,12,16] }
	])('flatMap(range($start, $end), $mapPredicate) allows re-run', ({ start, end, mapPredicate, expectedPredicateCalls }) => {
		const mapPredicateSpy = vi.fn(mapPredicate as Mapper<number, Iterable<number | string>>);
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
		{ start: 1, end: 4, mapPredicate: (_v, idx) => range(idx), expectedResult: [0,0,1] },
		{ start: 1, end: 5, mapPredicate: (_v, idx) => range(idx), expectedResult: [0,0,1,0,1,2] },
		{ start: 1, end: 5, mapPredicate: v => loremIpsum.substring(0, v), expectedResult: ['L', 'L', 'o', 'L', 'o', 'r', 'L', 'o', 'r', 'e' ] },
	])('flatMap(range($start, $end), $mapPredicate) -> $expectedResult', ({ start, end, mapPredicate, expectedResult }) => {
		const r = collectToArray(flatMap<number, number | string>(range(start, end), mapPredicate));
		expect(r).toEqual(expectedResult);
	});

	test('flatMap is transformation', () => {
		expectTransformation(source => flatMap(source, v => range(v)));
	});

	test('return() closes inner and source', () => {
		const outer = closableSource([1]);
		const inner = closableSource([10, 20]);
		const it = flatMap(outer.iterable, () => inner.iterable)[Symbol.iterator]();
		expect(it.next().value).toBe(10);
		it.return!();
		expect(inner.state.closed).toBe(true);
		expect(outer.state.closed).toBe(true);
	});

	test('return() before next() does not throw', () => {
		expect(() => flatMap([1], v => [v])[Symbol.iterator]().return!()).not.toThrow();
	});

	test('empty inner iterables are skipped', () => {
		expect([...flatMap([[], [1], [], [2, 3], []], (v: number[]) => v)]).toEqual([1, 2, 3]);
	});

	test('inner arrays are read by index, as in Array.prototype.flatMap', () => {
		const iteratorSpy = vi.fn(() => [][Symbol.iterator]());
		const inner = Object.assign([1, 2], { [Symbol.iterator]: iteratorSpy });
		expect([...flatMap([0], () => inner)]).toEqual([1, 2]);
		expect(iteratorSpy).not.toHaveBeenCalled();
	});

	test('holes of an inner array become undefined', () => {
		// eslint-disable-next-line no-sparse-arrays
		expect([...flatMap([0], () => [1, , 3])]).toEqual([1, undefined, 3]);
	});

	test('values pushed to an inner array while reading it are read', () => {
		const inner = [1];
		const result: number[] = [];
		for (const v of flatMap([0], () => inner)) {
			result.push(v);
			if (inner.length < 3)
				inner.push(v + 1);
		}
		expect(result).toEqual([1, 2, 3]);
	});

	test('stopping inside an inner array closes the source', () => {
		const outer = closableSource([1, 2, 3]);
		const it = flatMap(outer.iterable, v => [v, v])[Symbol.iterator]();
		expect(it.next()).toEqual({ done: false, value: 1 });
		expect(it.next()).toEqual({ done: false, value: 1 });
		it.return!();
		expect(outer.state.closed).toBe(true);
		expect(it.next()).toEqual({ done: true, value: undefined });
	});

	test('arrays and other iterables can be mixed', () => {
		expect([...flatMap([0, 1, 2, 3], v => v % 2 === 0 ? [v, v] : range(v, v + 2))]).toEqual([0, 0, 1, 2, 2, 2, 3, 4]);
	});

	test('return(value) is forwarded to inner and source', () => {
		const sourceReturn = vi.fn((v?: unknown) => ({ done: true as const, value: v }));
		const innerReturn = vi.fn((v?: unknown) => ({ done: true as const, value: v }));
		const source: Iterable<number> = { [Symbol.iterator]: () => ({ next: () => ({ done: false, value: 1 }), return: sourceReturn }) };
		const inner: Iterable<number> = { [Symbol.iterator]: () => ({ next: () => ({ done: false, value: 10 }), return: innerReturn }) };
		const it = flatMap(source, () => inner)[Symbol.iterator]();
		it.next();
		it.return!('x');
		expect(innerReturn).toHaveBeenCalledWith('x');
		expect(sourceReturn).toHaveBeenCalledWith('x');
	});

	test('outer source is closed even if inner return() throws', () => {
		const err = new Error('inner return');
		const outer = closableSource([1]);
		const inner: Iterable<number> = { [Symbol.iterator]: () => ({ next: () => ({ done: false, value: 10 }), return: () => { throw err; } }) };
		const it = flatMap(outer.iterable, () => inner)[Symbol.iterator]();
		it.next();
		expect(() => it.return!()).toThrow(err);
		expect(outer.state.closed).toBe(true);
	});

	test('a throwing mapper propagates the same error', () => {
		const err = new Error('boom');
		expect(() => collectToArray(flatMap([1], () => { throw err; }))).toThrow(err);
	});

});
