import { describe, expect, test, vi } from 'vitest';

import { range } from '@/functions';

describe('range', () => {

	test('checks range function definition', () => {
		expect(range).toHaveLength(3);
	});

	test('range function with one argument', () => {

		const rangeSpyFunc = vi.fn((start) => range(start));
		const ranged = rangeSpyFunc(10);
		expect(rangeSpyFunc).toHaveReturned();
		expect(ranged[Symbol.iterator]).toBeInstanceOf(Function);

		const rangeIterator = ranged[Symbol.iterator]();
		expect(rangeIterator).toHaveProperty('next');
	});

	test('range function with two arguments', () => {

		const rangeSpyFunc = vi.fn((start, end) => range(start, end));
		let ranged = rangeSpyFunc(10, 20);

		expect(rangeSpyFunc).toHaveReturned();
		expect(ranged[Symbol.iterator]).toBeInstanceOf(Function);

		let rangeIterator = ranged[Symbol.iterator]();
		expect(rangeIterator).toHaveProperty('next');

		ranged = rangeSpyFunc(10, { reverse: true });

		expect(rangeSpyFunc).toHaveReturnedTimes(2);
		expect(ranged[Symbol.iterator]).toBeInstanceOf(Function);

		rangeIterator = ranged[Symbol.iterator]();
		expect(rangeIterator).toHaveProperty('next');
	});

	test('range function with three arguments', () => {

		const rangeSpyFunc = vi.fn((start, end, options) => range(start, end, options));
		let ranged = rangeSpyFunc(10, 20, { step: 2 });

		expect(rangeSpyFunc).toHaveReturned();
		expect(ranged[Symbol.iterator]).toBeInstanceOf(Function);

		let rangeIterator = ranged[Symbol.iterator]();
		expect(rangeIterator).toHaveProperty('next');

		ranged = rangeSpyFunc(10, 20, { reverse: true });

		expect(rangeSpyFunc).toHaveReturnedTimes(2);
		expect(ranged[Symbol.iterator]).toBeInstanceOf(Function);

		rangeIterator = ranged[Symbol.iterator]();
		expect(rangeIterator).toHaveProperty('next');
	});

	test.each([
		{ end: 0, initialValue: 0, length: 0, expectedStep: 0, generatedRange: [] },
		{ end: 10, initialValue: 0, length: 10, expectedStep: 1, generatedRange: [0,1,2,3,4,5,6,7,8,9] },
		{ end: -10, initialValue: 0, length: 10, expectedStep: -1, generatedRange: [0,-1,-2,-3,-4,-5,-6,-7,-8,-9] },
		{ end: 15, initialValue: 0, length: 15, expectedStep: 1, generatedRange: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14] },
		{ end: -15, initialValue: 0, length: 15, expectedStep: -1, generatedRange: [0,-1,-2,-3,-4,-5,-6,-7,-8,-9,-10,-11,-12,-13,-14] },
	])('create range(end: $end)', ({ end, length, generatedRange }) => {

		const ranged = range(end);

		const iterated = [...ranged];
		expect(iterated).toHaveLength(length);
		expect(iterated).toEqual(generatedRange);
	});

	test.each([
		{ end: 0, reverse: false, initialValue: 0, length: 0, expectedStep: 0, generatedRange: [] },
		{ end: 0, reverse: true, initialValue: 0, length: 0, expectedStep: 0, generatedRange: [] },

		{ end: 10, reverse: false, initialValue: 0, length: 10, expectedStep: 1, generatedRange: [0,1,2,3,4,5,6,7,8,9] },
		{ end: 10, reverse: true, initialValue: 9, length: 10, expectedStep: 1, generatedRange: [9,8,7,6,5,4,3,2,1,0] },
		{ end: -10, reverse: false, initialValue: 0, length: 10, expectedStep: -1, generatedRange: [0,-1,-2,-3,-4,-5,-6,-7,-8,-9] },
		{ end: -10, reverse: true, initialValue: -9, length: 10, expectedStep: -1, generatedRange: [-9,-8,-7,-6,-5,-4,-3,-2,-1,0] },

		{ end: 15, reverse: false, initialValue: 0, length: 15, expectedStep: 1, generatedRange: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14] },
		{ end: 15, reverse: true, initialValue: 14, length: 15, expectedStep: 1, generatedRange: [14,13,12,11,10,9,8,7,6,5,4,3,2,1,0] },
		{ end: -15, reverse: false, initialValue: 0, length: 15, expectedStep: -1, generatedRange: [0,-1,-2,-3,-4,-5,-6,-7,-8,-9,-10,-11,-12,-13,-14] },
		{ end: -15, reverse: true, initialValue: -14, length: 15, expectedStep: -1, generatedRange: [-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0] }
	])('create range(end: $end, reverse: $reverse)', ({ end, reverse, length, generatedRange }) => {

		const ranged = range(end, { reverse });

		const iterated = [...ranged];
		expect(iterated).toHaveLength(length);
		expect(iterated).toEqual(generatedRange);
	});

	test.each([
		{ start: 0, end: 0, initialValue: 0, length: 0, expectedStep: 0, generatedRange: [] },

		{ start: 5, end: 10, initialValue: 5, length: 5, expectedStep: 1, generatedRange: [5,6,7,8,9] },
		{ start: -5, end: 10, initialValue: -5, length: 15, expectedStep: 1, generatedRange: [-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9] },
		{ start: -15, end: -10, initialValue: -15, length: 5, expectedStep: 1, generatedRange: [-15,-14,-13,-12,-11] },

		{ start: 10, end: 5, initialValue: 10, length: 5, expectedStep: -1, generatedRange: [10,9,8,7,6] },
		{ start: 5, end: -10, initialValue: 5, length: 15, expectedStep: -1, generatedRange: [5,4,3,2,1,0,-1,-2,-3,-4,-5,-6,-7,-8,-9] },
		{ start: -5, end: -10, initialValue: -5, length: 5, expectedStep: -1, generatedRange: [-5,-6,-7,-8,-9] },
	])('create range(start: $start, end: $end)', ({ start, end, length, generatedRange }) => {

		const ranged = range(start, end);

		const iterated = [...ranged];
		expect(iterated).toHaveLength(length);
		expect(iterated).toEqual(generatedRange);
	});

	test.each([
		{ start: 0, end: 0, reverse: false, initialValue: 0, length: 0, expectedStep: 0, generatedRange: [] },
		{ start: 0, end: 0, reverse: true, initialValue: 0, length: 0, expectedStep: 0, generatedRange: [] },

		{ start: 5, end: 10, reverse: false, initialValue: 5, length: 5, expectedStep: 1, generatedRange: [5,6,7,8,9] },
		{ start: 5, end: 10, reverse: true, initialValue: 9, length: 5, expectedStep: 1, generatedRange: [9,8,7,6,5] },
		{ start: -5, end: 3, reverse: false, initialValue: -5, length: 8, expectedStep: 1, generatedRange: [-5,-4,-3,-2,-1,0,1,2] },
		{ start: -5, end: 3, reverse: true, initialValue: 2, length: 8, expectedStep: 1, generatedRange: [2,1,0,-1,-2,-3,-4,-5] },
		{ start: -6, end: -1, reverse: false, initialValue: -6, length: 5, expectedStep: 1, generatedRange: [-6,-5,-4,-3,-2] },
		{ start: -6, end: -1, reverse: true, initialValue: -2, length: 5, expectedStep: 1, generatedRange: [-2,-3,-4,-5,-6] },

		{ start: 10, end: 0, reverse: false, initialValue: 10, length: 10, expectedStep: -1, generatedRange: [10,9,8,7,6,5,4,3,2,1] },
		{ start: 10, end: 0, reverse: true, initialValue: 1, length: 10, expectedStep: -1, generatedRange: [1,2,3,4,5,6,7,8,9,10] },
		{ start: 5, end: -10, reverse: false, initialValue: 5, length: 15, expectedStep: -1, generatedRange: [5,4,3,2,1,0,-1,-2,-3,-4,-5,-6,-7,-8,-9] },
		{ start: 5, end: -10, reverse: true, initialValue: -9, length: 15, expectedStep: -1, generatedRange: [-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5] },
		{ start: -5, end: -10, reverse: false, initialValue: -5, length: 5, expectedStep: -1, generatedRange: [-5,-6,-7,-8,-9] },
		{ start: -5, end: -10, reverse: true, initialValue: -9, length: 5, expectedStep: -1, generatedRange: [-9,-8,-7,-6,-5,] },
	])('create range(start: $start, end: $end, reverse: $reverse)', ({ start, end, reverse, length, generatedRange }) => {

		const ranged = range(start, end, { reverse });

		const iterated = [...ranged];
		expect(iterated).toHaveLength(length);
		expect(iterated).toEqual(generatedRange);
	});

	test.each([
		{ start: 0, end: 0, step: 2, initialValue: 0, length: 0, expectedStep: 0, generatedRange: [] },

		{ start: 5, end: 10, step: 2, initialValue: 5, length: 3, expectedStep: 2, generatedRange: [5,7,9] },
		{ start: 5, end: 10, step: -2, initialValue: 5, length: 3, expectedStep: 2, generatedRange: [5,7,9] },
		{ start: -5, end: 3, step: 2, initialValue: -5, length: 4, expectedStep: 2, generatedRange: [-5,-3,-1,1] },
		{ start: -5, end: 3, step: -2, initialValue: -5, length: 4, expectedStep: 2, generatedRange: [-5,-3,-1,1] },
		{ start: -6, end: -1, step: 2, initialValue: -6, length: 3, expectedStep: 2, generatedRange: [-6,-4,-2] },
		{ start: -6, end: -1, step: -2, initialValue: -6, length: 3, expectedStep: 2, generatedRange: [-6,-4,-2] },

		{ start: 10, end: 0, step: 2, initialValue: 10, length: 5, expectedStep: -2, generatedRange: [10,8,6,4,2] },
		{ start: 10, end: 0, step: -2, initialValue: 10, length: 5, expectedStep: -2, generatedRange: [10,8,6,4,2] },
		{ start: 5, end: -10, step: 2, initialValue: 5, length: 8, expectedStep: -2, generatedRange: [5,3,1,-1,-3,-5,-7,-9] },
		{ start: 5, end: -10, step: -2, initialValue: 5, length: 8, expectedStep: -2, generatedRange: [5,3,1,-1,-3,-5,-7,-9] },
		{ start: -5, end: -10, step: 2, initialValue: -5, length: 3, expectedStep: -2, generatedRange: [-5,-7,-9] },
		{ start: -5, end: -10, step: -2, initialValue: -5, length: 3, expectedStep: -2, generatedRange: [-5,-7,-9] },
	])('create range(start: $start, end: $end, step: $step)', ({ start, end, step, length, generatedRange }) => {

		const ranged = range(start, end, { step });

		const iterated = [...ranged];
		expect(iterated).toHaveLength(length);
		expect(iterated).toEqual(generatedRange);
	});

	test.each([
		{ start: 0, end: 0, step: 2, reverse: false, initialValue: 0, length: 0, expectedStep: 0, generatedRange: [] },
		{ start: 0, end: 0, step: 2, reverse: true, initialValue: 0, length: 0, expectedStep: 0, generatedRange: [] },

		{ start: 5, end: 10, step: 2, reverse: false, initialValue: 5, length: 3, expectedStep: 2, generatedRange: [5,7,9] },
		{ start: 5, end: 10, step: 2, reverse: true, initialValue: 9, length: 3, expectedStep: 2, generatedRange: [9,7,5] },
		{ start: 5, end: 10, step: -2, reverse: false, initialValue: 5, length: 3, expectedStep: 2, generatedRange: [5,7,9] },
		{ start: 5, end: 10, step: -2, reverse: true, initialValue: 9, length: 3, expectedStep: 2, generatedRange: [9,7,5] },
		{ start: -5, end: 3, step: 2, reverse: false, initialValue: -5, length: 4, expectedStep: 2, generatedRange: [-5,-3,-1,1] },
		{ start: -5, end: 3, step: 2, reverse: true, initialValue: 1, length: 4, expectedStep: 2, generatedRange: [1,-1,-3,-5] },
		{ start: -5, end: 3, step: -2, reverse: false, initialValue: -5, length: 4, expectedStep: 2, generatedRange: [-5,-3,-1,1] },
		{ start: -5, end: 3, step: -2, reverse: true, initialValue: 1, length: 4, expectedStep: 2, generatedRange: [1,-1,-3,-5] },
		{ start: -6, end: -1, step: 2, reverse: false, initialValue: -6, length: 3, expectedStep: 2, generatedRange: [-6,-4,-2] },
		{ start: -6, end: -1, step: 2, reverse: true, initialValue: -2, length: 3, expectedStep: 2, generatedRange: [-2,-4,-6] },
		{ start: -6, end: -1, step: -2, reverse: false, initialValue: -6, length: 3, expectedStep: 2, generatedRange: [-6,-4,-2] },
		{ start: -6, end: -1, step: -2, reverse: true, initialValue: -2, length: 3, expectedStep: 2, generatedRange: [-2,-4,-6] },

		{ start: 10, end: 0, step: 2, reverse: false, initialValue: 10, length: 5, expectedStep: -2, generatedRange: [10,8,6,4,2] },
		{ start: 10, end: 0, step: 2, reverse: true, initialValue: 2, length: 5, expectedStep: -2, generatedRange: [2,4,6,8,10] },
		{ start: 10, end: 0, step: -2, reverse: false, initialValue: 10, length: 5, expectedStep: -2, generatedRange: [10,8,6,4,2] },
		{ start: 10, end: 0, step: -2, reverse: true, initialValue: 2, length: 5, expectedStep: -2, generatedRange: [2,4,6,8,10] },
		{ start: 5, end: -10, step: 2, reverse: false, initialValue: 5, length: 8, expectedStep: -2, generatedRange: [5,3,1,-1,-3,-5,-7,-9] },
		{ start: 5, end: -10, step: 2, reverse: true, initialValue: -9, length: 8, expectedStep: -2, generatedRange: [-9,-7,-5,-3,-1,1,3,5] },
		{ start: 5, end: -10, step: -2, reverse: false, initialValue: 5, length: 8, expectedStep: -2, generatedRange: [5,3,1,-1,-3,-5,-7,-9] },
		{ start: 5, end: -10, step: -2, reverse: true, initialValue: -9, length: 8, expectedStep: -2, generatedRange: [-9,-7,-5,-3,-1,1,3,5] },
		{ start: -5, end: -10, step: 2, reverse: false, initialValue: -5, length: 3, expectedStep: -2, generatedRange: [-5,-7,-9] },
		{ start: -5, end: -10, step: 2, reverse: true, initialValue: -9, length: 3, expectedStep: -2, generatedRange: [-9,-7,-5] },
		{ start: -5, end: -10, step: -2, reverse: false, initialValue: -5, length: 3, expectedStep: -2, generatedRange: [-5,-7,-9] },
		{ start: -5, end: -10, step: -2, reverse: true, initialValue: -9, length: 3, expectedStep: -2, generatedRange: [-9,-7,-5] },
	])('create range(start: $start, end: $end, step: $step, reverse: $reverse)', ({ start, end, step, reverse, length, generatedRange }) => {

		const ranged = range(start, end, { step, reverse });

		const iterated = [...ranged];
		expect(iterated).toHaveLength(length);
		expect(iterated).toEqual(generatedRange);
	});

	test('iterator stays done', () => {
		const it = range(3)[Symbol.iterator]();
		expect([it.next(), it.next(), it.next()].map(r => r.value)).toEqual([0, 1, 2]);
		for (let i = 0; i < 3; i++)
			expect(it.next().done).toBe(true);
	});

	test('decimal step has no accumulated error', () => {
		expect([...range(0, 1, { step: 0.1 })]).toEqual(Array.from({ length: 10 }, (_, i) => i * 0.1));
	});

	test.each([
		{ args: [NaN] },
		{ args: [0, NaN] },
		{ args: [NaN, 5] }
	])('range($args) with a NaN bound is empty', ({ args }) => {
		const it = (range as (...a: number[]) => Iterable<number>)(...args)[Symbol.iterator]();
		expect(it.next().done).toBe(true);
	});

	test.each([0, NaN, Infinity, -Infinity])('range(0, 10, { step: %s }) throws', step => {
		expect(() => range(0, 10, { step })).toThrow(Error);
	});

	test('the old positional signatures throw', () => {
		const legacyRange = range as (...args: unknown[]) => Iterable<number>;
		expect(() => legacyRange(10, true)).toThrow(Error);
		expect(() => legacyRange(0, 10, 2)).toThrow(Error);
		expect(() => legacyRange(0, 10, true)).toThrow(Error);
	});

	test('range(end, options)', () => {
		expect([...range(10, { step: 3 })]).toEqual([0, 3, 6, 9]);
		expect([...range(10, { step: 3, reverse: true })]).toEqual([9, 6, 3, 0]);
	});

	test('options in third position without a numeric start throw', () => {
		expect(() => (range as (...a: unknown[]) => unknown)(10, undefined, { step: 2 })).toThrow(Error);
	});

});
