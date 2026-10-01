import { describe, expect, test, vi } from 'vitest';
import { closableSource } from '../_helpers/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { expectAction } from '../_helpers/operationKind';

import {
	range,
	some
} from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

describe('some', () => {

	test('some without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(some);
	});

	test.each([
		{ values: [], expected: false },
		{ values: [0], expected: true },
		{ values: [0, 1], expected: true }
	])('some($values) returns $expected without a predicate', ({ values, expected }) => {
		expect(some(values)).toBe(expected);
		expect(some(values, undefined)).toBe(expected);
	});

	test.each([null, 0, {}])('some rejects invalid predicate %s', predicate => {
		expect(() => some([1], predicate as never)).toThrow();
	});

	test('some without a predicate closes the source after one value', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(some(iterable)).toBe(true);
		expect(state.closed).toBe(true);
	});

	test('some without a predicate reads only one value', () => {
		let produced = 0;
		function* source() {
			for (const value of [1, 2, 3]) {
				produced++;
				yield value;
			}
		}
		expect(some(source())).toBe(true);
		expect(produced).toBe(1);
	});

	test('some without a predicate terminates on an infinite source', () => {
		const { stats, iterable } = infiniteSource();
		expect(some(iterable)).toBe(true);
		expect(stats.reads).toBe(1);
	});

	test.each([
		{ start: 10, end: 50, predicate: v => v > 10, expectedResult: true },
		{ start: 10, end: 50, predicate: v => v > 100, expectedResult: false },
		{ start: 10, end: 50, predicate: v => v < 10, expectedResult: false },
		{ start: 10, end: 50, predicate: v => v < 100, expectedResult: true },

		{ start: 50, end: 10, predicate: v => v > 10, expectedResult: true },
		{ start: 50, end: 10, predicate: v => v > 100, expectedResult: false },
		{ start: 50, end: 10, predicate: v => v < 10, expectedResult: false },
		{ start: 50, end: 10, predicate: v => v < 100, expectedResult: true }
	])('some(range($start, $end), $predicate) -> $expectedResult', ({ start, end, predicate, expectedResult }) => {
		const r = some(range(start,end), predicate);
		expect(r).toBe(expectedResult);
	});

	test.each([
		{ text: 'ciao', predicate: v => v === 'a', expectedResult: true },
		{ text: 'ciao', predicate: v => v === 'z', expectedResult: false },
		{ text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', predicate: v => v === 't', expectedResult: true },
		{ text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', predicate: v => v === 'z', expectedResult: false }
	])('some($text, $predicate) -> $expectedReasult', ({ text, predicate, expectedResult }) => {
		const r = some(text, predicate);
		expect(r).toBe(expectedResult);
	});

	test.each([
		{ start: 10, end: 50, predicate: (_v, idx) => idx > 10, expectedResult: true },
		{ start: 10, end: 50, predicate: (_v, idx) => idx > 100, expectedResult: false },
		{ start: 10, end: 50, predicate: (_v, idx) => idx < 10, expectedResult: true },
		{ start: 10, end: 50, predicate: (_v, idx) => idx < 100, expectedResult: true },

		{ start: 50, end: 10, predicate: (_v, idx) => idx > 10, expectedResult: true },
		{ start: 50, end: 10, predicate: (_v, idx) => idx > 100, expectedResult: false },
		{ start: 50, end: 10, predicate: (_v, idx) => idx < 10, expectedResult: true },
		{ start: 50, end: 10, predicate: (_v, idx) => idx < 100, expectedResult: true }
	])('some(range($start, $end), $predicate) -> $expectedResult', ({ start, end, predicate, expectedResult }) => {
		const r = some(range(start,end), predicate);
		expect(r).toBe(expectedResult);
	});

	test.each([
		{ start: 10, end: 50, predicate: v => v > 10, expectedFunctionCalls: 2 },
		{ start: 10, end: 50, predicate: v => v > 100, expectedFunctionCalls: 40 },
		{ start: 10, end: 50, predicate: v => v < 10, expectedFunctionCalls: 40 },
		{ start: 10, end: 50, predicate: v => v < 100, expectedFunctionCalls: 1 },

		{ start: 50, end: 10, predicate: v => v > 10, expectedFunctionCalls: 1 },
		{ start: 50, end: 10, predicate: v => v > 100, expectedFunctionCalls: 40 },
		{ start: 50, end: 10, predicate: v => v < 10, expectedFunctionCalls: 40 },
		{ start: 50, end: 10, predicate: v => v < 100, expectedFunctionCalls: 1 }
	])('short circuits - some(range($start, $end), $predicate)', ({ start, end, predicate, expectedFunctionCalls}) => {
		const predicateSpy = vi.fn(predicate);
		some(range(start,end), predicateSpy);
		expect(predicateSpy).toHaveReturnedTimes(expectedFunctionCalls);
	});

	test.each([
		{ text: 'ciao', predicate: v => v === 'a', expectedFunctionCalls: 3 },
		{ text: 'ciao', predicate: v => v === 'z', expectedFunctionCalls: 4 },
		{ text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', predicate: v => v === 'a', expectedFunctionCalls: 23 },
		{ text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', predicate: v => v === 'z', expectedFunctionCalls: 56 }
	])('short circuits - some($text, $predicate)', ({ text, predicate, expectedFunctionCalls }) => {
		const predicateSpy = vi.fn(predicate);
		some(text, predicateSpy);
		expect(predicateSpy).toHaveReturnedTimes(expectedFunctionCalls);
	});

	test.each([
		{ start: 10, end: 50, predicate: (_v, idx) => idx > 10, expectedFunctionCalls: 12 },
		{ start: 10, end: 50, predicate: (_v, idx) => idx > 100, expectedFunctionCalls: 40 },
		{ start: 10, end: 50, predicate: (_v, idx) => idx < 10, expectedFunctionCalls: 1 },
		{ start: 10, end: 50, predicate: (_v, idx) => idx < 100, expectedFunctionCalls: 1 },

		{ start: 50, end: 10, predicate: (_v, idx) => idx > 10, expectedFunctionCalls: 12 },
		{ start: 50, end: 10, predicate: (_v, idx) => idx > 100, expectedFunctionCalls: 40 },
		{ start: 50, end: 10, predicate: (_v, idx) => idx < 10, expectedFunctionCalls: 1 },
		{ start: 50, end: 10, predicate: (_v, idx) => idx < 100, expectedFunctionCalls: 1 }
	])('short circuits - some(range($start, $end), $predicate)', ({ start, end, predicate, expectedFunctionCalls}) => {
		const predicateSpy = vi.fn(predicate);
		some(range(start,end), predicateSpy);
		expect(predicateSpy).toHaveReturnedTimes(expectedFunctionCalls);
	});

	test('some is action', () => {
		expectAction(source => some(source, v => v > 2));
		expectAction(source => some(source));
	});

	test('stopping early closes the source', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(some(iterable, v => v === 1)).toBe(true);
		expect(state.closed).toBe(true);
	});

	test('a throwing predicate closes the source', () => {
		const err = new Error('boom');
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(() => some(iterable, () => { throw err; })).toThrow(err);
		expect(state.closed).toBe(true);
	});

});
