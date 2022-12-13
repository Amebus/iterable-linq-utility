import { beforeEach, describe, expect, test } from 'vitest';

import * as LinqIterable from '../../src';
import {
	range,
	some
} from '@/functions';

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
		{ text: 'ciao', predicate: v => { functionCalls++; return v === 'a'; }, expectedFunctionCalls: 3 },
		{ text: 'ciao', predicate: v => { functionCalls++; return v === 'z'; }, expectedFunctionCalls: 4 },
		{ text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', predicate: v => { functionCalls++; return v === 'a'; }, expectedFunctionCalls: 23 },
		{ text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', predicate: v => { functionCalls++; return v === 'z'; }, expectedFunctionCalls: 56 }
	])('short circuits - some($text, $predicate)', ({ text, predicate, expectedFunctionCalls }) => {
		some(text, predicate);
		expect(functionCalls).toBe(expectedFunctionCalls);
	});

	test.each([
		{ start: 10, end: 50, predicate: (_v, idx) => { functionCalls++; return idx > 10; }, expectedFunctionCalls: 12 },
		{ start: 10, end: 50, predicate: (_v, idx) => { functionCalls++; return idx > 100; }, expectedFunctionCalls: 40 },
		{ start: 10, end: 50, predicate: (_v, idx) => { functionCalls++; return idx < 10; }, expectedFunctionCalls: 1 },
		{ start: 10, end: 50, predicate: (_v, idx) => { functionCalls++; return idx < 100; }, expectedFunctionCalls: 1 },

		{ start: 50, end: 10, predicate: (_v, idx) => { functionCalls++; return idx > 10; }, expectedFunctionCalls: 12 },
		{ start: 50, end: 10, predicate: (_v, idx) => { functionCalls++; return idx > 100; }, expectedFunctionCalls: 40 },
		{ start: 50, end: 10, predicate: (_v, idx) => { functionCalls++; return idx < 10; }, expectedFunctionCalls: 1 },
		{ start: 50, end: 10, predicate: (_v, idx) => { functionCalls++; return idx < 100; }, expectedFunctionCalls: 1 }
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
		{ start: 10, end: 50, predicate: (_v, idx) => idx > 10, expectedResult: true },
		{ start: 10, end: 50, predicate: (_v, idx) => idx > 100, expectedResult: false },
		{ start: 10, end: 50, predicate: (_v, idx) => idx < 10, expectedResult: true },
		{ start: 10, end: 50, predicate: (_v, idx) => idx < 100, expectedResult: true },

		{ start: 50, end: 10, predicate: (_v, idx) => idx > 10, expectedResult: true },
		{ start: 50, end: 10, predicate: (_v, idx) => idx > 100, expectedResult: false },
		{ start: 50, end: 10, predicate: (_v, idx) => idx < 10, expectedResult: true },
		{ start: 50, end: 10, predicate: (_v, idx) => idx < 100, expectedResult: true }
	])('linqIterable(range($start, $end)).some($predicate) -> $expectedResult', ({ start, end, predicate, expectedResult }) => {
		const r = LinqIterable.from(range(start,end)).some(predicate);
		expect(r).toBe(expectedResult);
	});

	test.each([
		{ text: 'ciao', predicate: v => v === 'a', expectedResult: true },
		{ text: 'ciao', predicate: v => v === 'z', expectedResult: false },
		{ text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', predicate: v => v === 't', expectedResult: true },
		{ text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', predicate: v => v === 'z', expectedResult: false }
	])('linqIterable($text).some($predicate) -> $expectedReasult', ({ text, predicate, expectedResult }) => {
		const r = LinqIterable.from(text).some(predicate);
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
		{ text: 'ciao', predicate: v => { functionCalls++; return v === 'a'; }, expectedFunctionCalls: 3 },
		{ text: 'ciao', predicate: v => { functionCalls++; return v === 'z'; }, expectedFunctionCalls: 4 },
		{ text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', predicate: v => { functionCalls++; return v === 'a'; }, expectedFunctionCalls: 23 },
		{ text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', predicate: v => { functionCalls++; return v === 'z'; }, expectedFunctionCalls: 56 }
	])('short circuits - linqIterable($text).some($predicate)', ({ text, predicate, expectedFunctionCalls }) => {
		LinqIterable.from(text).some(predicate);
		expect(functionCalls).toBe(expectedFunctionCalls);
	});

	test.each([
		{ start: 10, end: 50, predicate: (_v, idx) => { functionCalls++; return idx > 10; }, expectedFunctionCalls: 12 },
		{ start: 10, end: 50, predicate: (_v, idx) => { functionCalls++; return idx > 100; }, expectedFunctionCalls: 40 },
		{ start: 10, end: 50, predicate: (_v, idx) => { functionCalls++; return idx < 10; }, expectedFunctionCalls: 1 },
		{ start: 10, end: 50, predicate: (_v, idx) => { functionCalls++; return idx < 100; }, expectedFunctionCalls: 1 },

		{ start: 50, end: 10, predicate: (_v, idx) => { functionCalls++; return idx > 10; }, expectedFunctionCalls: 12 },
		{ start: 50, end: 10, predicate: (_v, idx) => { functionCalls++; return idx > 100; }, expectedFunctionCalls: 40 },
		{ start: 50, end: 10, predicate: (_v, idx) => { functionCalls++; return idx < 10; }, expectedFunctionCalls: 1 },
		{ start: 50, end: 10, predicate: (_v, idx) => { functionCalls++; return idx < 100; }, expectedFunctionCalls: 1 }
	])('short circuits - linqIterable(range($start, $end)).some($predicate)', ({ start, end, predicate, expectedFunctionCalls}) => {
		LinqIterable.from(range(start,end)).some(predicate);
		expect(functionCalls).toBe(expectedFunctionCalls);
	});

});