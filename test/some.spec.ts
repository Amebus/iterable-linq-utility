import { beforeEach, describe, expect, test } from 'vitest';

import * as LinqIterable from '../src/';
import { range } from '../src/range';
import { some } from '../src/some';

describe('some', () => {

	let functionCalls = 0;

	beforeEach(() => {
		functionCalls = 0;
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
		{ start: 10, end: 50, predicate: (v, idx) => idx > 10, expectedResult: true },
		{ start: 10, end: 50, predicate: (v, idx) => idx > 100, expectedResult: false },
		{ start: 10, end: 50, predicate: (v, idx) => idx < 10, expectedResult: true },
		{ start: 10, end: 50, predicate: (v, idx) => idx < 100, expectedResult: true },

		{ start: 50, end: 10, predicate: (v, idx) => idx > 10, expectedResult: true },
		{ start: 50, end: 10, predicate: (v, idx) => idx > 100, expectedResult: false },
		{ start: 50, end: 10, predicate: (v, idx) => idx < 10, expectedResult: true },
		{ start: 50, end: 10, predicate: (v, idx) => idx < 100, expectedResult: true }
	])('some(range($start, $end), $predicate) -> $expectedResult', ({ start, end, predicate, expectedResult }) => {
		const r = some(range(start,end), predicate);
		expect(r).toBe(expectedResult);
	});

	test.each([
		{ start: 10, end: 50, predicate: v => { functionCalls++; return v > 10; }, expectedFunctionCalls: 2 },
		{ start: 10, end: 50, predicate: v => { functionCalls++; return v > 100; }, expectedFunctionCalls: 40 },
		{ start: 10, end: 50, predicate: v => { functionCalls++; return v < 10; }, expectedFunctionCalls: 40 },
		{ start: 10, end: 50, predicate: v => { functionCalls++; return v < 100; }, expectedFunctionCalls: 1 },

		{ start: 50, end: 10, predicate: v => { functionCalls++; return v > 10; }, expectedFunctionCalls: 1 },
		{ start: 50, end: 10, predicate: v => { functionCalls++; return v > 100; }, expectedFunctionCalls: 40 },
		{ start: 50, end: 10, predicate: v => { functionCalls++; return v < 10; }, expectedFunctionCalls: 40 },
		{ start: 50, end: 10, predicate: v => { functionCalls++; return v < 100; }, expectedFunctionCalls: 1 }
	])('short circuits - some(range($start, $end), $predicate)', ({ start, end, predicate, expectedFunctionCalls}) => {
		some(range(start,end), predicate);
		expect(functionCalls).toBe(expectedFunctionCalls);
	});

	test.each([
		{ start: 10, end: 50, predicate: (v, idx) => { functionCalls++; return idx > 10; }, expectedFunctionCalls: 12 },
		{ start: 10, end: 50, predicate: (v, idx) => { functionCalls++; return idx > 100; }, expectedFunctionCalls: 40 },
		{ start: 10, end: 50, predicate: (v, idx) => { functionCalls++; return idx < 10; }, expectedFunctionCalls: 1 },
		{ start: 10, end: 50, predicate: (v, idx) => { functionCalls++; return idx < 100; }, expectedFunctionCalls: 1 },

		{ start: 50, end: 10, predicate: (v, idx) => { functionCalls++; return idx > 10; }, expectedFunctionCalls: 12 },
		{ start: 50, end: 10, predicate: (v, idx) => { functionCalls++; return idx > 100; }, expectedFunctionCalls: 40 },
		{ start: 50, end: 10, predicate: (v, idx) => { functionCalls++; return idx < 10; }, expectedFunctionCalls: 1 },
		{ start: 50, end: 10, predicate: (v, idx) => { functionCalls++; return idx < 100; }, expectedFunctionCalls: 1 }
	])('short circuits - some(range($start, $end), $predicate)', ({ start, end, predicate, expectedFunctionCalls}) => {
		some(range(start,end), predicate);
		expect(functionCalls).toBe(expectedFunctionCalls);
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
	])('linqIterable(range($start, $end)).some($predicate) -> $expectedResult', ({ start, end, predicate, expectedResult }) => {
		const r = LinqIterable.from(range(start,end)).some(predicate);
		expect(r).toBe(expectedResult);
	});

	test.each([
		{ start: 10, end: 50, predicate: (v, idx) => idx > 10, expectedResult: true },
		{ start: 10, end: 50, predicate: (v, idx) => idx > 100, expectedResult: false },
		{ start: 10, end: 50, predicate: (v, idx) => idx < 10, expectedResult: true },
		{ start: 10, end: 50, predicate: (v, idx) => idx < 100, expectedResult: true },

		{ start: 50, end: 10, predicate: (v, idx) => idx > 10, expectedResult: true },
		{ start: 50, end: 10, predicate: (v, idx) => idx > 100, expectedResult: false },
		{ start: 50, end: 10, predicate: (v, idx) => idx < 10, expectedResult: true },
		{ start: 50, end: 10, predicate: (v, idx) => idx < 100, expectedResult: true }
	])('linqIterable(range($start, $end)).some($predicate) -> $expectedResult', ({ start, end, predicate, expectedResult }) => {
		const r = LinqIterable.from(range(start,end)).some(predicate);
		expect(r).toBe(expectedResult);
	});


	test.each([
		{ start: 10, end: 50, predicate: v => { functionCalls++; return v > 10; }, expectedFunctionCalls: 2 },
		{ start: 10, end: 50, predicate: v => { functionCalls++; return v > 100; }, expectedFunctionCalls: 40 },
		{ start: 10, end: 50, predicate: v => { functionCalls++; return v < 10; }, expectedFunctionCalls: 40 },
		{ start: 10, end: 50, predicate: v => { functionCalls++; return v < 100; }, expectedFunctionCalls: 1 },

		{ start: 50, end: 10, predicate: v => { functionCalls++; return v > 10; }, expectedFunctionCalls: 1 },
		{ start: 50, end: 10, predicate: v => { functionCalls++; return v > 100; }, expectedFunctionCalls: 40 },
		{ start: 50, end: 10, predicate: v => { functionCalls++; return v < 10; }, expectedFunctionCalls: 40 },
		{ start: 50, end: 10, predicate: v => { functionCalls++; return v < 100; }, expectedFunctionCalls: 1 }
	])('short circuits - linqIterable(range($start, $end)).some($predicate)', ({ start, end, predicate, expectedFunctionCalls}) => {
		LinqIterable.from(range(start,end)).some(predicate);
		expect(functionCalls).toBe(expectedFunctionCalls);
	});

	test.each([
		{ start: 10, end: 50, predicate: (v, idx) => { functionCalls++; return idx > 10; }, expectedFunctionCalls: 12 },
		{ start: 10, end: 50, predicate: (v, idx) => { functionCalls++; return idx > 100; }, expectedFunctionCalls: 40 },
		{ start: 10, end: 50, predicate: (v, idx) => { functionCalls++; return idx < 10; }, expectedFunctionCalls: 1 },
		{ start: 10, end: 50, predicate: (v, idx) => { functionCalls++; return idx < 100; }, expectedFunctionCalls: 1 },

		{ start: 50, end: 10, predicate: (v, idx) => { functionCalls++; return idx > 10; }, expectedFunctionCalls: 12 },
		{ start: 50, end: 10, predicate: (v, idx) => { functionCalls++; return idx > 100; }, expectedFunctionCalls: 40 },
		{ start: 50, end: 10, predicate: (v, idx) => { functionCalls++; return idx < 10; }, expectedFunctionCalls: 1 },
		{ start: 50, end: 10, predicate: (v, idx) => { functionCalls++; return idx < 100; }, expectedFunctionCalls: 1 }
	])('short circuits - linqIterable(range($start, $end)).some($predicate)', ({ start, end, predicate, expectedFunctionCalls}) => {
		LinqIterable.from(range(start,end)).some(predicate);
		expect(functionCalls).toBe(expectedFunctionCalls);
	});

});