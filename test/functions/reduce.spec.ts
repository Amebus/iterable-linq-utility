import { describe, expect, test } from 'vitest';

import { 
	reduce,
	range
} from "@/functions";
import { withoutInputIterableThrowsException } from './functionsTestUtility';

describe('reduce', () => {

	test('max without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(reduce);
	});

	test.each([
		{ start: 0, end: 20 },
		{ start: -10, end: 10 },
		{ start: 0, end: 20, reducer: undefined },
		{ start: 0, end: 20, reducer: null },
		{ start: 0, end: 20, reducer: {} }
	])('flatMap without mapper -> throw exception', ({ start, end, reducer }) => {
		const reduceJs = reduce as any;
		expect(() => reduceJs(range(start, end))).toThrowError();
		expect(() => reduceJs(range(start, end), reducer)).toThrowError();
	});

	test.each([
		{ start: 0, end: 15, acc: 0, reducer: (acc, v) => acc + v, expectedResult: 105 },
		{ start: 0, end: 15, acc: 10, reducer: (acc, v) => acc + v, expectedResult: 115 },
		{ start: -14, end: 15, acc: 0, reducer: (acc, v) => acc + v, expectedResult: 0 },
		{ start: -14, end: 15, acc: 10, reducer: (acc, v) => acc + v, expectedResult: 10 },

		{ start: 1, end: 5, acc: 0, reducer: (acc, v) => acc * v, expectedResult: 0 },
		{ start: 1, end: 5, acc: 10, reducer: (acc, v) => acc * v, expectedResult: 240 },
		{ start: -5, end: 0, acc: 0, reducer: (acc, v) => acc * v, expectedResult: -0 },
		{ start: -5, end: 0, acc: 10, reducer: (acc, v) => acc * v, expectedResult: -1200 },

		{ start: 0, end: 15, acc: 0, reducer: (acc, v, idx) => acc + idx, expectedResult: 105 },
		{ start: 0, end: 15, acc: 10, reducer: (acc, v, idx) => acc + idx, expectedResult: 115 },
		{ start: 20, end: 15, acc: 0, reducer: (acc, v, idx) => acc + idx, expectedResult: 10 },
		{ start: 20, end: 15, acc: 5, reducer: (acc, v, idx) => acc + idx, expectedResult: 15 }
	])('reduce(range($start, $end), $acc, $reducer) -> $expectedResult', ({ start, end, acc, reducer, expectedResult }) => {
		const r = reduce(range(start, end), acc, reducer);
		expect(r).toBe(expectedResult);
	});

	test.each([
		{ iterable: 'ciao', acc: '', reducer: (acc, v) => acc + v, expectedResult: 'ciao' },
		{ iterable: 'ciao', acc: '', reducer: (acc, v, idx) => acc + idx, expectedResult: '0123' }
	])('reduce($iterable, $acc, $reducer) -> $expectedResult', ({ iterable, acc, reducer, expectedResult }) => {
		const r = reduce(iterable, acc, reducer);
		expect(r).toBe(expectedResult);
	});

});
