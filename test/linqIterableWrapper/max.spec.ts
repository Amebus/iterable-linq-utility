import { describe, expect, test } from 'vitest';

import * as LinqIterable from '../../src';

describe('LinqIterable.max', () => {
	
	test.each([
		{ start: 0, end: 0, expectedResult: null },
		{ start: 10, end: 50, expectedResult: 49 },
		{ start: 50, end: 10, expectedResult: 50 }
	])('LinqIterable.fromRange($start, $end).max() -> $expectedResult', ({ start, end, expectedResult }) => {
		const r = LinqIterable.fromRange(start,end).max();
		expect(r).toBe(expectedResult);
	});


	test.each([
		{ text: '', expectedResult: null },
		{ text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', expectedResult: 'u' },
	])('LinqIterable.from("$text").max() -> $expectedResult', ({ text, expectedResult }) => {
		const r = LinqIterable.from(text).max();
		expect(r).toBe(expectedResult);
	});


	test.each([
		{ data: [], expectedResult: null },
		{ data: [{ val: 10 }], expectedResult: { val: 10 } },
		{ data: [{ val: 10 }, { val: 1 }], expectedResult: { val: 10 } }
	])('LinqIterable.from($data).max("val") -> $expectedResult', ({ data, expectedResult }) => {
		const r = LinqIterable.from(data).max('val');
		expect(r).toStrictEqual(expectedResult);
	});

	test.each([
		{ data: [], expectedResult: null },
		{ data: [{ text: 'Lorem' }], expectedResult: { text: 'Lorem' } },
		{ data: [{ text: 'Lorem' }, { text: 'ipsum' }], expectedResult: { text: 'ipsum' } },
		{ data: [{ text: 'lorem' }, { text: 'ipsum' }], expectedResult: { text: 'lorem' } }
	])('LinqIterable.from(data).max("text") -> $expectedResult', ({ data, expectedResult }) => {
		const r = LinqIterable.from(data).max('text');
		expect(r).toStrictEqual(expectedResult);
	});

	test.each([
		{ data: [], expectedResult: null },
		{ data: [{ val1: 10, val2: 2 }], expectedResult: { val1: 10, val2: 2 } },
		{ data: [{ val1: 10, val2: 7 }, { val1: 1, val2: 27 }], expectedResult: { val1: 10, val2: 7 } }
	])('LinqIterable.from(data).max(["val1", "val2"]) -> $expectedResult', ({ data, expectedResult }) => {
		const r = LinqIterable.from(data).max(['val1', 'val2']);
		expect(r).toStrictEqual(expectedResult);
	});

	test.each([
		{ data: [], expectedResult: null },
		{ data: [{ val1: 10, val2: 2 }], expectedResult: { val1: 10, val2: 2 } },
		{ data: [{ val1: 10, val2: 7 }, { val1: 1, val2: 27 }], expectedResult: { val1: 1, val2: 27 } }
	])('LinqIterable.from(data).max(["val2", "val1"]) -> $expectedResult', ({ data, expectedResult }) => {
		const r = LinqIterable.from(data).max(['val2', 'val1']);
		expect(r).toStrictEqual(expectedResult);
	});

	test.each([
		{ data: [], expectedResult: null },
		{ data: [{ t1: 'ipsum', t2: 'dolor' }], expectedResult: { t1: 'ipsum', t2: 'dolor' } },
		{ data: [{ t1: 'lorem', t2: 'ipsum' }, { t1: 'dolor', t2: 'amet' }, { t1: 'sit', t2: 'consectetur' }], expectedResult: { t1: 'sit', t2: 'consectetur' } }
	])('LinqIterable.from(data).max(["t1", "t2"]) -> $expectedResult', ({ data, expectedResult }) => {
		const r = LinqIterable.from(data).max(['t1', 't2']);
		expect(r).toStrictEqual(expectedResult);
	});
	
	test.each([
		{ data: [], expectedResult: null },
		{ data: [{ t1: 'ipsum', t2: 'dolor' }], expectedResult: { t1: 'ipsum', t2: 'dolor' } },
		{ data: [{ t1: 'lorem', t2: 'ipsum' }, { t1: 'dolor', t2: 'amet' }, { t1: 'sit', t2: 'consectetur' }], expectedResult: { t1: 'lorem', t2: 'ipsum' } }
	])('LinqIterable.from(data).max(["t2", "t1"]) -> $expectedResult', ({ data, expectedResult }) => {
		const r = LinqIterable.from(data).max(['t2', 't1']);
		expect(r).toStrictEqual(expectedResult);
	});

	test.each([
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		{ start: 10, end: 50, comparer: (a,_b) => a > 10 ? -1 : 1, expectedResult: 10 },
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		{ start: 10, end: 50, comparer: (a,_b) => a > 100 ? -1 : 1, expectedResult: 10 },
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		{ start: 10, end: 50, comparer: (a,_b) => a < 10 ? -1 : 1, expectedResult: 10 },
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		{ start: 10, end: 50, comparer: (a,_b) => a < 100 ? -1 : 1, expectedResult: 49 },

		{ start: 10, end: 50, comparer: (_a,b) => b < 10 ? 1 : -1, expectedResult: 49 },
		{ start: 10, end: 50, comparer: (_a,b) => b > 100 ? 1 : -1, expectedResult: 49 },
		{ start: 10, end: 50, comparer: (_a,b) => b < 10 ? 1 : -1, expectedResult: 49 },
		{ start: 10, end: 50, comparer: (_a,b) => b < 100 ? 1 : -1, expectedResult: 10 },
	])('LinqIterable.fromRange($start, $end).max($comparer) -> $expectedResult', ({ start, end, comparer, expectedResult }) => {
		const r = LinqIterable.fromRange(start,end).max(comparer);
		expect(r).toBe(expectedResult);
	});

});