import { describe, expect, test } from 'vitest';

import { 
	max,
	range
} from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

describe('max', () => {

	test('max without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(max);
	});

	test.each([
		{ start: 0, end: 0, expectedResult: null },
		{ start: 10, end: 50, expectedResult: 49 },
		{ start: 50, end: 10, expectedResult: 50 }
	])('max(range($start, $end)) -> $expectedResult', ({ start, end, expectedResult }) => {
		const rangeIterable = range(start,end);
		const r = max(rangeIterable);
		expect(r).toBe(expectedResult);
	});


	test.each([
		{ text: '', expectedResult: null },
		{ text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', expectedResult: 'u' },
	])('max("$text") -> $expectedResult', ({ text, expectedResult }) => {
		const r = max(text);
		expect(r).toBe(expectedResult);
	});


	test.each([
		{ data: [], expectedResult: null },
		{ data: [{ val: 10 }], expectedResult: { val: 10 } },
		{ data: [{ val: 10 }, { val: 1 }], expectedResult: { val: 10 } }
	])('max($data, "val") -> $expectedResult', ({ data, expectedResult }) => {
		const r = max(data, 'val');
		expect(r).toStrictEqual(expectedResult);
	});

	test.each([
		{ data: [], expectedResult: null },
		{ data: [{ text: 'Lorem' }], expectedResult: { text: 'Lorem' } },
		{ data: [{ text: 'Lorem' }, { text: 'ipsum' }], expectedResult: { text: 'ipsum' } },
		{ data: [{ text: 'lorem' }, { text: 'ipsum' }], expectedResult: { text: 'lorem' } }
	])('max($data, "text") -> $expectedResult', ({ data, expectedResult }) => {
		const r = max(data, 'text');
		expect(r).toStrictEqual(expectedResult);
	});

	test.each([
		{ data: [], expectedResult: null },
		{ data: [{ val1: 10, val2: 2 }], expectedResult: { val1: 10, val2: 2 } },
		{ data: [{ val1: 10, val2: 7 }, { val1: 1, val2: 27 }], expectedResult: { val1: 10, val2: 7 } }
	])('max($data, ["val1", "val2"]) -> $expectedResult', ({ data, expectedResult }) => {
		const r = max(data, ['val1', 'val2']);
		expect(r).toStrictEqual(expectedResult);
	});

	test.each([
		{ data: [], expectedResult: null },
		{ data: [{ val1: 10, val2: 2 }], expectedResult: { val1: 10, val2: 2 } },
		{ data: [{ val1: 10, val2: 7 }, { val1: 1, val2: 27 }], expectedResult: { val1: 1, val2: 27 } }
	])('max($data, ["val2", "val1"]) -> $expectedResult', ({ data, expectedResult }) => {
		const r = max(data, ['val2', 'val1']);
		expect(r).toStrictEqual(expectedResult);
	});

	test.each([
		{ data: [], expectedResult: null },
		{ data: [{ t1: 'ipsum', t2: 'dolor' }], expectedResult: { t1: 'ipsum', t2: 'dolor' } },
		{ data: [{ t1: 'lorem', t2: 'ipsum' }, { t1: 'dolor', t2: 'amet' }, { t1: 'sit', t2: 'consectetur' }], expectedResult: { t1: 'sit', t2: 'consectetur' } }
	])('max($data, ["t1", "t2"]) -> $expectedResult', ({ data, expectedResult }) => {
		const r = max(data, ['t1', 't2']);
		expect(r).toStrictEqual(expectedResult);
	});
	
	test.each([
		{ data: [], expectedResult: null },
		{ data: [{ t1: 'ipsum', t2: 'dolor' }], expectedResult: { t1: 'ipsum', t2: 'dolor' } },
		{ data: [{ t1: 'lorem', t2: 'ipsum' }, { t1: 'dolor', t2: 'amet' }, { t1: 'sit', t2: 'consectetur' }], expectedResult: { t1: 'lorem', t2: 'ipsum' } }
	])('max($data, ["t2", "t1"]) -> $expectedResult', ({ data, expectedResult }) => {
		const r = max(data, ['t2', 't1']);
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
	])('max(range($start, $end), $comparer) -> $expectedResult', ({ start, end, comparer, expectedResult }) => {
		const r = max(range(start,end), comparer);
		expect(r).toBe(expectedResult);
	});

});