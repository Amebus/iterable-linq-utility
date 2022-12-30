import { describe, expect, test, vi } from 'vitest';

import { IterableLinq } from './_linqIterable';

const tapper = () => {
	// just an empty function
};

describe('IterableLinq.memoize', () => {

	// test.each([
	// 	{ start: 0, end: 20, returnValue: 'a value' },
	// 	{ start: 0, end: 20, returnValue: 123 },
	// 	{ start: 0, end: 20, returnValue: null },
	// 	{ start: 0, end: 20 },
	// 	{ start: 0, end: 20, allowPartialMemoization: true, returnValue: 'a value' },
	// 	{ start: 0, end: 20, allowPartialMemoization: true, returnValue: 123 },
	// 	{ start: 0, end: 20, allowPartialMemoization: true, returnValue: null },
	// 	{ start: 0, end: 20, allowPartialMemoization: true }
	// ])('memoize(range($start, $end))[Symbol.iterator]().return() closes the iterator', ({ start, end, allowPartialMemoization, returnValue }) => {
	// 	const filterIterable = IterableLinq.fromRange(start, end).memoize(allowPartialMemoization);
	// 	returnClosesTheIterator(filterIterable, returnValue);
	// });

	
	test.each([
		{ start: 0, end: 20 },
		{ start: 0, end: 20 },
		{ start: -10, end: 10 },
		{ start: 0, end: 20, allowPartialMemoization: true },
		{ start: 0, end: 20, allowPartialMemoization: true },
		{ start: -10, end: 10, allowPartialMemoization: true }
	])('IterableLinq.memoize() is transformation - IterableLinq.fromRange($start, $end)', ({ start, end, allowPartialMemoization }) => {
		const tapperSpy = vi.fn(tapper);
		const memoized = IterableLinq
			.fromRange(start,end)
			.tap(tapperSpy)
			.memoize(allowPartialMemoization);
		expect(tapperSpy).not.toHaveBeenCalled();
		memoized.collectToArray();
		expect(tapperSpy).toHaveReturned();
	});

	test.each([
		{ start: 0, end: 0, expectedTapperCalls: [0,0,0,0] },
		{ start: 0, end: 20, expectedTapperCalls: [20,20,20,20] },
		{ start: 0, end: 20, expectedTapperCalls: [20,20,20,20] },
		{ start: -10, end: 10, expectedTapperCalls: [20,20,20,20] },
		{ start: 0, end: 20, expectedTapperCalls: [20,20,20,20], allowPartialMemoization: true },
		{ start: 0, end: 20, expectedTapperCalls: [20,20,20,20], allowPartialMemoization: true },
		{ start: -10, end: 10, expectedTapperCalls: [20,20,20,20], allowPartialMemoization: true }
	])('IterableLinq.memoize() saves data - IterableLinq.fromRange($start, $end)', ({ start, end, expectedTapperCalls, allowPartialMemoization }) => {
		const tapperSpy = vi.fn(tapper);
		const memoized = IterableLinq
			.fromRange(start,end)
			.tap(tapperSpy)
			.memoize(allowPartialMemoization);
		expectedTapperCalls
			.forEach(expectedCalls => {
				memoized.collectToArray();
				expect(tapperSpy).toHaveBeenCalledTimes(expectedCalls);
			});
	});

	test.each([
		{ start: 0, end: 0, expectedTapperCalls: [0,0,0,0], expectedSomeCalls: [0,0,0,0], expectedTapperCallsAfterSome: [0,0,0,0] },
		{ start: 0, end: 20, expectedTapperCalls: [20,20,20,20], expectedSomeCalls: [2,2,2,2], expectedTapperCallsAfterSome: [2,20,20,20] },
		{ start: -10, end: 10, expectedTapperCalls: [20,20,20,20], expectedSomeCalls: [12,12,12,12], expectedTapperCallsAfterSome: [12,20,20,20] }
	])('IterableLinq.memoize(true) partially saves data - IterableLinq.fromRange($start, $end)', ({ start, end, expectedTapperCalls, expectedSomeCalls, expectedTapperCallsAfterSome }) => {
		const tapperSpy = vi.fn(tapper);
		const memoized = IterableLinq
			.fromRange(start,end)
			.tap(tapperSpy)
			.memoize(true);
		expectedTapperCalls
			.forEach((expectedCalls, idx) => {
				const someSpy = vi.fn(v => v > 0);
				memoized.some(someSpy);
				
				expect(someSpy).toHaveReturnedTimes(expectedSomeCalls[idx]);
				expect(tapperSpy).toHaveBeenCalledTimes(expectedTapperCallsAfterSome[idx]);

				memoized.collectToArray();
				expect(tapperSpy).toHaveBeenCalledTimes(expectedCalls);
			});
	});

	test.each([
		{ start: 0, end: 0, expectedTapperCalls: [0,0,0,0], expectedSomeCalls: [0,0,0,0], expectedTapperCallsAfterSome: [0,0,0,0] },
		{ start: 0, end: 20, expectedTapperCalls: [20,20,20,20], expectedSomeCalls: [2,2,2,2], expectedTapperCallsAfterSome: [2,20,20,20] },
		{ start: -10, end: 10, expectedTapperCalls: [20,20,20,20], expectedSomeCalls: [12,12,12,12], expectedTapperCallsAfterSome: [12,20,20,20] }
	])('IterableLinq.memoize().memoize(true) partially saves data - IterableLinq.fromRange($start, $end)', ({ start, end, expectedTapperCalls, expectedSomeCalls, expectedTapperCallsAfterSome }) => {
		const tapperSpy = vi.fn(tapper);
		const memoized = IterableLinq
			.fromRange(start,end)
			.tap(tapperSpy)
			.memoize()
			.memoize(true);
		expectedTapperCalls
			.forEach((expectedCalls, idx) => {
				const someSpy = vi.fn(v => v > 0);
				memoized.some(someSpy);
				
				expect(someSpy).toHaveReturnedTimes(expectedSomeCalls[idx]);
				expect(tapperSpy).toHaveBeenCalledTimes(expectedTapperCallsAfterSome[idx]);

				memoized.collectToArray();
				expect(tapperSpy).toHaveBeenCalledTimes(expectedCalls);
			});
	});

	test.each([
		{ start: 0, end: 0, expectedTapperCalls: [0,0,0,0], expectedSomeCalls: [0,0,0,0], expectedTapperCallsAfterSome: [0,0,0,0] },
		{ start: 0, end: 20, expectedTapperCalls: [20,20,20,20], expectedSomeCalls: [2,2,2,2], expectedTapperCallsAfterSome: [20,20,20,20] },
		{ start: -10, end: 10, expectedTapperCalls: [20,20,20,20], expectedSomeCalls: [12,12,12,12], expectedTapperCallsAfterSome: [20,20,20,20] }
	])('IterableLinq.memoize() fully saves data - IterableLinq.fromRange($start, $end)', ({ start, end, expectedTapperCalls, expectedSomeCalls, expectedTapperCallsAfterSome }) => {
		const tapperSpy = vi.fn(tapper);
		const memoized = IterableLinq
			.fromRange(start,end)
			.tap(tapperSpy)
			.memoize();
		expectedTapperCalls
		.forEach((expectedCalls, idx) => {
				const someSpy = vi.fn(v => v > 0);
				memoized.some(someSpy);
				
				expect(someSpy).toHaveReturnedTimes(expectedSomeCalls[idx]);
				expect(tapperSpy).toHaveBeenCalledTimes(expectedTapperCallsAfterSome[idx]);

				memoized.collectToArray();
				expect(tapperSpy).toHaveBeenCalledTimes(expectedCalls);
			});
	});

	test.each([
		{ start: 0, end: 0, expectedTapperCalls: [0,0,0,0], expectedSomeCalls: [0,0,0,0], expectedTapperCallsAfterSome: [0,0,0,0] },
		{ start: 0, end: 20, expectedTapperCalls: [20,20,20,20], expectedSomeCalls: [2,2,2,2], expectedTapperCallsAfterSome: [20,20,20,20] },
		{ start: -10, end: 10, expectedTapperCalls: [20,20,20,20], expectedSomeCalls: [12,12,12,12], expectedTapperCallsAfterSome: [20,20,20,20] }
	])('IterableLinq.memoize(true).memoize() fully saves data - IterableLinq.fromRange($start, $end)', ({ start, end, expectedTapperCalls, expectedSomeCalls, expectedTapperCallsAfterSome }) => {
		const tapperSpy = vi.fn(tapper);
		const memoized = IterableLinq
			.fromRange(start,end)
			.tap(tapperSpy)
			.memoize(true)
			.memoize();
		expectedTapperCalls
			.forEach((expectedCalls, idx) => {
				const someSpy = vi.fn(v => v > 0);
				memoized.some(someSpy);
				
				expect(someSpy).toHaveReturnedTimes(expectedSomeCalls[idx]);
				expect(tapperSpy).toHaveBeenCalledTimes(expectedTapperCallsAfterSome[idx]);

				memoized.collectToArray();
				expect(tapperSpy).toHaveBeenCalledTimes(expectedCalls);
			});
	});

});
