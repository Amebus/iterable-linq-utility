import { describe, expect, test } from 'vitest';
import { expectAction } from '../_helpers/operationKind';

import {
	min,
	range
} from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

describe('min', () => {

	test('max without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(min);
	});

	test.each([
		{ start: 0, end: 0, expectedResult: undefined },
		{ start: 10, end: 50, expectedResult: 10 },
		{ start: 50, end: 10, expectedResult: 11 }
	])('min(range($start, $end)) -> $expectedResult', ({ start, end, expectedResult }) => {
		const rangeIterable = range(start,end);
		const r = min(rangeIterable);
		expect(r).toBe(expectedResult);
	});

	test.each([
		{ text: '', expectedResult: undefined },
		{ text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', expectedResult: ' ' },
	])('min("$text") -> $expectedResult', ({ text, expectedResult }) => {
		const r = min(text);
		expect(r).toBe(expectedResult);
	});

	test.each([
		{ data: [], expectedResult: undefined },
		{ data: [{ val: 10 }], expectedResult: { val: 10 } },
		{ data: [{ val: 10 }, { val: 1 }], expectedResult: { val: 1 } }
	])('min($data, "val") -> $expectedResult', ({ data, expectedResult }) => {
		const r = min(data, 'val');
		expect(r).toStrictEqual(expectedResult);
	});

	test.each([
		{ data: [], expectedResult: undefined },
		{ data: [{ text: 'Lorem' }], expectedResult: { text: 'Lorem' } },
		{ data: [{ text: 'Lorem' }, { text: 'ipsum' }], expectedResult: { text: 'Lorem' } },
		{ data: [{ text: 'lorem' }, { text: 'ipsum' }], expectedResult: { text: 'ipsum' } }
	])('min($data, "text") -> $expectedResult', ({ data, expectedResult }) => {
		const r = min(data, 'text');
		expect(r).toStrictEqual(expectedResult);
	});

	test.each([
		{ data: [], expectedResult: undefined },
		{ data: [{ val1: 10, val2: 2 }], expectedResult: { val1: 10, val2: 2 } },
		{ data: [{ val1: 10, val2: 7 }, { val1: 1, val2: 27 }], expectedResult: { val1: 1, val2: 27 } }
	])('min($data, ["val1", "val2"]) -> $expectedResult', ({ data, expectedResult }) => {
		const r = min(data, ['val1', 'val2']);
		expect(r).toStrictEqual(expectedResult);
	});

	test.each([
		{ data: [], expectedResult: undefined },
		{ data: [{ val1: 10, val2: 2 }], expectedResult: { val1: 10, val2: 2 } },
		{ data: [{ val1: 10, val2: 7 }, { val1: 1, val2: 27 }], expectedResult: { val1: 10, val2: 7 } }
	])('min($data, ["val2", "val1"]) -> $expectedResult', ({ data, expectedResult }) => {
		const r = min(data, ['val2', 'val1']);
		expect(r).toStrictEqual(expectedResult);
	});

	test.each([
		{ data: [], expectedResult: undefined },
		{ data: [{ t1: 'ipsum', t2: 'dolor' }], expectedResult: { t1: 'ipsum', t2: 'dolor' } },
		{ data: [{ t1: 'lorem', t2: 'ipsum' }, { t1: 'dolor', t2: 'amet' }, { t1: 'sit', t2: 'consectetur' }], expectedResult: { t1: 'dolor', t2: 'amet' } }
	])('min($data, ["t1", "t2"]) -> $expectedResult', ({ data, expectedResult }) => {
		const r = min(data, ['t1', 't2']);
		expect(r).toStrictEqual(expectedResult);
	});

	test.each([
		{ data: [], expectedResult: undefined },
		{ data: [{ t1: 'ipsum', t2: 'dolor' }], expectedResult: { t1: 'ipsum', t2: 'dolor' } },
		{ data: [{ t1: 'lorem', t2: 'ipsum' }, { t1: 'dolor', t2: 'amet' }, { t1: 'sit', t2: 'consectetur' }], expectedResult: { t1: 'dolor', t2: 'amet' } }
	])('min($data, ["t2", "t1"]) -> $expectedResult', ({ data, expectedResult }) => {
		const r = min(data, ['t2', 't1']);
		expect(r).toStrictEqual(expectedResult);
	});

	test.each([
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		{ start: 10, end: 50, comparer: (a,_b) => a > 10 ? -1 : 1, expectedResult: 11 },
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		{ start: 10, end: 50, comparer: (a,_b) => a > 100 ? -1 : 1, expectedResult: 49 },
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		{ start: 10, end: 50, comparer: (a,_b) => a < 10 ? -1 : 1, expectedResult: 49 },
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		{ start: 10, end: 50, comparer: (a,_b) => a < 100 ? -1 : 1, expectedResult: 10 },

		{ start: 10, end: 50, comparer: (_a,b) => b < 10 ? 1 : -1, expectedResult: 10 },
		{ start: 10, end: 50, comparer: (_a,b) => b > 100 ? 1 : -1, expectedResult: 10 },
		{ start: 10, end: 50, comparer: (_a,b) => b < 100 ? 1 : -1, expectedResult: 49 },
	])('min(range($start, $end), $comparer) -> $expectedResult', ({ start, end, comparer, expectedResult }) => {
		const r = min(range(start,end), comparer);
		expect(r).toBe(expectedResult);
	});

	test('min is action', () => {
		expectAction(source => min(source));
	});

	test.each([
		{ data: [1, null, 0], expected: 0 },
		{ data: [undefined, 2, 1], expected: 1 },
	])('min($data) ignores null and undefined -> $expected', ({ data, expected }) => {
		expect(min(data as number[])).toBe(expected);
	});

	test('min keeps the first among equals', () => {
		expect(min([{ v: 1, id: 'a' }, { v: 1, id: 'b' }], 'v')!.id).toBe('a');
	});

});
