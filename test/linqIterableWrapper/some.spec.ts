import { describe, expect, test, vi } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { expectAction } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('some', () => {

	test.each([
		{ values: [], expected: false },
		{ values: [0], expected: true },
		{ values: [0, 1], expected: true }
	])('some($values) returns $expected without a predicate', ({ values, expected }) => {
		expect(IterableLinq.from(values).some()).toBe(expected);
		expect(IterableLinq.from(values).some(undefined)).toBe(expected);
	});

	test.each([null, 0, {}])('some rejects invalid predicate %s', predicate => {
		expect(() => IterableLinq.from([1]).some(predicate as never)).toThrow();
	});

	test('some without a predicate closes the source', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(IterableLinq.from(iterable).some()).toBe(true);
		expect(state.closed).toBe(true);
	});

	test('some without a predicate terminates on an infinite source', () => {
		const { stats, iterable } = infiniteSource();
		expect(IterableLinq.from(iterable).some()).toBe(true);
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
	])('IterableLinq.fromRange($start, $end).some($predicate) -> $expectedResult', ({ start, end, predicate, expectedResult }) => {
		const r = IterableLinq
			.fromRange(start,end)
			.some(predicate);
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
	])('IterableLinq.fromRange($start, $end).some($predicate) -> $expectedResult', ({ start, end, predicate, expectedResult }) => {
		const r = IterableLinq
			.fromRange(start,end)
			.some(predicate);
		expect(r).toBe(expectedResult);
	});

	test.each([
		{ text: 'ciao', predicate: v => v === 'a', expectedResult: true },
		{ text: 'ciao', predicate: v => v === 'z', expectedResult: false },
		{ text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', predicate: v => v === 't', expectedResult: true },
		{ text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', predicate: v => v === 'z', expectedResult: false }
	])('IterableLinq.from($text).some($predicate) -> $expectedReasult', ({ text, predicate, expectedResult }) => {
		const r = IterableLinq
			.from(text)
			.some(predicate);
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
	])('short circuits - IterableLinq.fromRange($start, $end).some($predicate)', ({ start, end, predicate, expectedFunctionCalls}) => {
		const predicateSpy = vi.fn(predicate);
		IterableLinq
			.fromRange(start,end)
			.some(predicateSpy);
		expect(predicateSpy).toHaveReturnedTimes(expectedFunctionCalls);
	});

	test.each([
		{ text: 'ciao', predicate: v => v === 'a', expectedFunctionCalls: 3 },
		{ text: 'ciao', predicate: v => v === 'z', expectedFunctionCalls: 4 },
		{ text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', predicate: v => v === 'a', expectedFunctionCalls: 23 },
		{ text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', predicate: v => v === 'z', expectedFunctionCalls: 56 }
	])('short circuits - IterableLinq.from($text).some($predicate)', ({ text, predicate, expectedFunctionCalls }) => {
		const predicateSpy = vi.fn(predicate);
		IterableLinq
			.from(text)
			.some(predicateSpy);
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
	])('short circuits - IterableLinq.fromRange($start, $end).some($predicate)', ({ start, end, predicate, expectedFunctionCalls}) => {
		const predicateSpy = vi.fn(predicate);
		IterableLinq
			.fromRange(start,end)
			.some(predicateSpy);
		expect(predicateSpy).toHaveReturnedTimes(expectedFunctionCalls);
	});

	test('IterableLinq.some is action', () => {
		expectAction(source => IterableLinq.from(source).some(v => v > 2));
		expectAction(source => IterableLinq.from(source).some());
	});

});
