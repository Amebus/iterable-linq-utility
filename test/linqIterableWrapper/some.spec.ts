import { describe, expect, test, vi } from 'vitest';

import { IterableLinq } from './_linqIterable';
import { withoutInputFunctionThrowsException } from './linqIterableWrapperTestUtility';

describe('some', () => {

	test.each([
		{ start: 0, end: 20 },
		{ start: 0, end: 20 },
		{ start: -10, end: 10 }
	])('IterableLinq.some without predicate -> throw exception', ({ start, end }) => {
		withoutInputFunctionThrowsException(IterableLinq.fromRange(start, end), 'some');
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

});