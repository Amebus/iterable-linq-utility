// import { beforeEach, describe, expect, test } from 'vitest';

// import * as LinqIterable from '../../src/types/linqIterable';
// import { range } from '../../src/types/linqIterable/range';
// import { min } from '../../src/types/linqIterable/min';

// describe('some', () => {

// 	let functionCalls = 0;

// 	beforeEach(() => {
// 		functionCalls = 0;
// 	});

// 	test.each([
// 		{ start: 0, end: 0, expectedResult: null },
// 		{ start: 10, end: 50, expectedResult: 10 },
// 		{ start: 50, end: 10, expectedResult: 11 }
// 	])('min(range($start, $end)) -> $expectedResult', ({ start, end, expectedResult }) => {
// 		const r = min(range(start,end));
// 		expect(r).toBe(expectedResult);
// 	});

// 	test.each([
// 		{ start: 10, end: 50, comparer: (a,b) => a > 10 ? -1 : 1, expectedResult: 11 },
// 		{ start: 10, end: 50, comparer: (a,b) => a > 100 ? -1 : 1, expectedResult: 49 },
// 		{ start: 10, end: 50, comparer: (a,b) => a < 10 ? -1 : 1, expectedResult: 49 },
// 		{ start: 10, end: 50, comparer: (a,b) => a < 100 ? -1 : 1, expectedResult: 10 },

// 		{ start: 10, end: 50, comparer: (a,b) => b < 10 ? 1 : -1, expectedResult: 10 },
// 		{ start: 10, end: 50, comparer: (a,b) => b > 100 ? 1 : -1, expectedResult: 10 },
// 		{ start: 10, end: 50, comparer: (a,b) => b < 10 ? 1 : -1, expectedResult: 10 },
// 		{ start: 10, end: 50, comparer: (a,b) => b < 100 ? 1 : -1, expectedResult: 49 },

// 		// { start: 50, end: 10, comparer: (a,b) => v > 10, expectedResult: true },
// 		// { start: 50, end: 10, comparer: (a,b) => v > 100, expectedResult: false },
// 		// { start: 50, end: 10, comparer: (a,b) => v < 10, expectedResult: false },
// 		// { start: 50, end: 10, comparer: (a,b) => v < 100, expectedResult: true }
// 	])('min(range($start, $end), $comparer) -> $expectedResult', ({ start, end, comparer, expectedResult }) => {
// 		const r = min(range(start,end), comparer);
// 		expect(r).toBe(expectedResult);
// 	});

// 	test.each([
// 		{ start: 10, end: 50, comparer: (a,b, idx) => a > 10 ? -1 : 1, expectedResult: 11 },
// 		{ start: 10, end: 50, comparer: (a,b, idx) => a > 100 ? -1 : 1, expectedResult: null },
// 		{ start: 10, end: 50, comparer: (a,b, idx) => a < 10 ? -1 : 1, expectedResult: null },
// 		{ start: 10, end: 50, comparer: (a,b, idx) => a < 100 ? -1 : 1, expectedResult: 11 },

// 		{ start: 10, end: 50, comparer: (a,b, idx) => { console.log(a,b); return b < 10 ? 1 : -1; }, expectedResult: 49 },
// 		{ start: 10, end: 50, comparer: (a,b, idx) => b > 100 ? 1 : -1, expectedResult: null },
// 		{ start: 10, end: 50, comparer: (a,b, idx) => b < 10 ? 1 : -1, expectedResult: null },
// 		{ start: 10, end: 50, comparer: (a,b, idx) => b < 100 ? 1 : -1, expectedResult: 49 },

// 		// { start: 50, end: 10, comparer: (a,b) => v > 10, expectedResult: true },
// 		// { start: 50, end: 10, comparer: (a,b) => v > 100, expectedResult: false },
// 		// { start: 50, end: 10, comparer: (a,b) => v < 10, expectedResult: false },
// 		// { start: 50, end: 10, comparer: (a,b) => v < 100, expectedResult: true }
// 	])('min(range($start, $end), $comparer) -> $expectedResult', ({ start, end, comparer, expectedResult }) => {
// 		const r = min(range(start,end), comparer);
// 		expect(r).toBe(expectedResult);
// 	});


// 	test.each([
// 		{ start: 0, end: 0, expectedResult: null },
// 		{ start: 10, end: 50, expectedResult: 10 },
// 		{ start: 50, end: 10, expectedResult: 11 }
// 	])('linqIterable(range($start, $end)).min() -> $expectedResult', ({ start, end, expectedResult }) => {
// 		const r = LinqIterable.from(range(start,end)).min();
// 		expect(r).toBe(expectedResult);
// 	});


// 	// test.each([
// 	// 	{ start: 10, end: 50, predicate: v => { functionCalls++; return v > 10; }, expectedFunctionCalls: 2 },
// 	// 	{ start: 10, end: 50, predicate: v => { functionCalls++; return v > 100; }, expectedFunctionCalls: 40 },
// 	// 	{ start: 10, end: 50, predicate: v => { functionCalls++; return v < 10; }, expectedFunctionCalls: 40 },
// 	// 	{ start: 10, end: 50, predicate: v => { functionCalls++; return v < 100; }, expectedFunctionCalls: 1 },

// 	// 	{ start: 50, end: 10, predicate: v => { functionCalls++; return v > 10; }, expectedFunctionCalls: 1 },
// 	// 	{ start: 50, end: 10, predicate: v => { functionCalls++; return v > 100; }, expectedFunctionCalls: 40 },
// 	// 	{ start: 50, end: 10, predicate: v => { functionCalls++; return v < 10; }, expectedFunctionCalls: 40 },
// 	// 	{ start: 50, end: 10, predicate: v => { functionCalls++; return v < 100; }, expectedFunctionCalls: 1 }
// 	// ])('short circuits - some(range($start, $end), $predicate)', ({ start, end, predicate, expectedFunctionCalls}) => {
// 	// 	min(range(start,end), predicate);
// 	// 	expect(functionCalls).toBe(expectedFunctionCalls);
// 	// });

// 	// test.each([
// 	// 	{ start: 10, end: 50, predicate: v => v > 10, expectedResult: true },
// 	// 	{ start: 10, end: 50, predicate: v => v > 100, expectedResult: false },
// 	// 	{ start: 10, end: 50, predicate: v => v < 10, expectedResult: false },
// 	// 	{ start: 10, end: 50, predicate: v => v < 100, expectedResult: true },

// 	// 	{ start: 50, end: 10, predicate: v => v > 10, expectedResult: true },
// 	// 	{ start: 50, end: 10, predicate: v => v > 100, expectedResult: false },
// 	// 	{ start: 50, end: 10, predicate: v => v < 10, expectedResult: false },
// 	// 	{ start: 50, end: 10, predicate: v => v < 100, expectedResult: true }
// 	// ])('linqIterable(range($start, $end)).some($predicate) -> $expectedResult', ({ start, end, predicate, expectedResult }) => {
// 	// 	const r = LinqIterable.from(range(start,end)).min(predicate);
// 	// 	expect(r).toBe(expectedResult);
// 	// });

// 	// test.each([
// 	// 	{ start: 10, end: 50, predicate: v => { functionCalls++; return v > 10; }, expectedFunctionCalls: 2 },
// 	// 	{ start: 10, end: 50, predicate: v => { functionCalls++; return v > 100; }, expectedFunctionCalls: 40 },
// 	// 	{ start: 10, end: 50, predicate: v => { functionCalls++; return v < 10; }, expectedFunctionCalls: 40 },
// 	// 	{ start: 10, end: 50, predicate: v => { functionCalls++; return v < 100; }, expectedFunctionCalls: 1 },

// 	// 	{ start: 50, end: 10, predicate: v => { functionCalls++; return v > 10; }, expectedFunctionCalls: 1 },
// 	// 	{ start: 50, end: 10, predicate: v => { functionCalls++; return v > 100; }, expectedFunctionCalls: 40 },
// 	// 	{ start: 50, end: 10, predicate: v => { functionCalls++; return v < 10; }, expectedFunctionCalls: 40 },
// 	// 	{ start: 50, end: 10, predicate: v => { functionCalls++; return v < 100; }, expectedFunctionCalls: 1 }
// 	// ])('short circuits - linqIterable(range($start, $end)).some($predicate)', ({ start, end, predicate, expectedFunctionCalls}) => {
// 	// 	LinqIterable.from(range(start,end)).min(predicate);
// 	// 	expect(functionCalls).toBe(expectedFunctionCalls);
// 	// });

// });