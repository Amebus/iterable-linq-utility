import { describe, expect, test, vi } from 'vitest';

import { 
	collectToArray,
	memoize,
	range,
	some,
	tap
} from './_functions';

import { returnClosesTheIterator, withoutInputIterableThrowsException } from './functionsTestUtility';
import { unit } from './_types';

const tapper = () => unit();

describe('memoize', () => {

	test('memoize without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(memoize);
	});

	test.each([
		{ start: 0, end: 20, returnValue: 'a value' },
		{ start: 0, end: 20, returnValue: 123 },
		{ start: 0, end: 20, returnValue: null },
		{ start: 0, end: 20 },
		{ start: 0, end: 20, allowPartialMemoization: false, returnValue: 'a value' },
		{ start: 0, end: 20, allowPartialMemoization: false, returnValue: 123 },
		{ start: 0, end: 20, allowPartialMemoization: false, returnValue: null },
		{ start: 0, end: 20, allowPartialMemoization: false }
	])('memoize(range($start, $end))[Symbol.iterator]().return() closes the iterator', ({ start, end, allowPartialMemoization, returnValue }) => {
		const filterIterable = memoize(range(start, end), { allowPartialMemoization });
		returnClosesTheIterator(filterIterable, returnValue);
	});

	
	test.each([
		{ start: 0, end: 20 },
		{ start: 0, end: 20 },
		{ start: -10, end: 10 },
		{ start: 0, end: 20, allowPartialMemoization: false },
		{ start: 0, end: 20, allowPartialMemoization: false },
		{ start: -10, end: 10, allowPartialMemoization: false }
	])('memoize() is transformation - range($start, $end)', ({ start, end, allowPartialMemoization }) => {
		const tapperSpy = vi.fn(tapper);
		const memoized = memoize(tap(range(start, end), tapperSpy), { allowPartialMemoization });
		expect(tapperSpy).not.toHaveBeenCalled();
		collectToArray(memoized);
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
	])('memoize() saves data - range($start, $end)', ({ start, end, expectedTapperCalls, allowPartialMemoization }) => {
		const tapperSpy = vi.fn(tapper);
		const memoized = memoize(tap(range(start, end), tapperSpy), { allowPartialMemoization });
		expectedTapperCalls
			.forEach(expectedCalls => {
				collectToArray(memoized);
				expect(tapperSpy).toHaveBeenCalledTimes(expectedCalls);
			});
	});

	test.each([
		{ start: 0, end: 0, expectedTapperCalls: [0,0,0,0], expectedSomeCalls: [0,0,0,0], expectedTapperCallsAfterSome: [0,0,0,0] },
		{ start: 0, end: 20, expectedTapperCalls: [20,20,20,20], expectedSomeCalls: [2,2,2,2], expectedTapperCallsAfterSome: [2,20,20,20] },
		{ start: -10, end: 10, expectedTapperCalls: [20,20,20,20], expectedSomeCalls: [12,12,12,12], expectedTapperCallsAfterSome: [12,20,20,20] }
	])('memoize(true) partially saves data - range($start, $end)', ({ start, end, expectedTapperCalls, expectedSomeCalls, expectedTapperCallsAfterSome }) => {
		const tapperSpy = vi.fn(tapper);
		const memoized = memoize(tap(range(start, end), tapperSpy));
		expectedTapperCalls
		.forEach((expectedCalls, idx) => {
				const someSpy = vi.fn(v => v > 0);
				some(memoized, someSpy);
				
				expect(someSpy).toHaveReturnedTimes(expectedSomeCalls[idx]);
				expect(tapperSpy).toHaveBeenCalledTimes(expectedTapperCallsAfterSome[idx]);

				collectToArray(memoized);
				expect(tapperSpy).toHaveBeenCalledTimes(expectedCalls);
			});
	});

	test.each([
		{ start: 0, end: 0, expectedTapperCalls: [0,0,0,0], expectedSomeCalls: [0,0,0,0], expectedTapperCallsAfterSome: [0,0,0,0] },
		{ start: 0, end: 20, expectedTapperCalls: [20,20,20,20], expectedSomeCalls: [2,2,2,2], expectedTapperCallsAfterSome: [2,20,20,20] },
		{ start: -10, end: 10, expectedTapperCalls: [20,20,20,20], expectedSomeCalls: [12,12,12,12], expectedTapperCallsAfterSome: [12,20,20,20] }
	])('memoize(memoize() ,true) partially saves data - range($start, $end)', ({ start, end, expectedTapperCalls, expectedSomeCalls, expectedTapperCallsAfterSome }) => {
		const tapperSpy = vi.fn(tapper);
		const memoized = memoize(memoize(tap(range(start, end), tapperSpy), { allowPartialMemoization: false }));
		expectedTapperCalls
		.forEach((expectedCalls, idx) => {
				const someSpy = vi.fn(v => v > 0);
				some(memoized, someSpy);
				
				expect(someSpy).toHaveReturnedTimes(expectedSomeCalls[idx]);
				expect(tapperSpy).toHaveBeenCalledTimes(expectedTapperCallsAfterSome[idx]);

				collectToArray(memoized);
				expect(tapperSpy).toHaveBeenCalledTimes(expectedCalls);
			});
	});

	test.each([
		{ start: 0, end: 0, expectedTapperCalls: [0,0,0,0], expectedSomeCalls: [0,0,0,0], expectedTapperCallsAfterSome: [0,0,0,0] },
		{ start: 0, end: 20, expectedTapperCalls: [20,20,20,20], expectedSomeCalls: [2,2,2,2], expectedTapperCallsAfterSome: [20,20,20,20] },
		{ start: -10, end: 10, expectedTapperCalls: [20,20,20,20], expectedSomeCalls: [12,12,12,12], expectedTapperCallsAfterSome: [20,20,20,20] }
	])('memoize({ allowPartialMemoization: false }) fully saves data - range($start, $end)', ({ start, end, expectedTapperCalls, expectedSomeCalls, expectedTapperCallsAfterSome }) => {
		const tapperSpy = vi.fn(tapper);
		const memoized = memoize(tap(range(start, end), tapperSpy), { allowPartialMemoization: false });
		expectedTapperCalls
		.forEach((expectedCalls, idx) => {
				const someSpy = vi.fn(v => v > 0);
				some(memoized, someSpy);
				
				expect(someSpy).toHaveReturnedTimes(expectedSomeCalls[idx]);
				expect(tapperSpy).toHaveBeenCalledTimes(expectedTapperCallsAfterSome[idx]);

				collectToArray(memoized);
				expect(tapperSpy).toHaveBeenCalledTimes(expectedCalls);
			});
	});

	test.each([
		{ start: 0, end: 0, expectedTapperCalls: [0,0,0,0], expectedSomeCalls: [0,0,0,0], expectedTapperCallsAfterSome: [0,0,0,0] },
		{ start: 0, end: 20, expectedTapperCalls: [20,20,20,20], expectedSomeCalls: [2,2,2,2], expectedTapperCallsAfterSome: [20,20,20,20] },
		{ start: -10, end: 10, expectedTapperCalls: [20,20,20,20], expectedSomeCalls: [12,12,12,12], expectedTapperCallsAfterSome: [20,20,20,20] }
	])('memoize(memoize({ allowPartialMemoization: false })) fully saves data - range($start, $end)', ({ start, end, expectedTapperCalls, expectedSomeCalls, expectedTapperCallsAfterSome }) => {
		const tapperSpy = vi.fn(tapper);
		const memoized = memoize(memoize(tap(range(start, end), tapperSpy)), { allowPartialMemoization: false });
		expectedTapperCalls
		.forEach((expectedCalls, idx) => {
				const someSpy = vi.fn(v => v > 0);
				some(memoized, someSpy);
				
				expect(someSpy).toHaveReturnedTimes(expectedSomeCalls[idx]);
				expect(tapperSpy).toHaveBeenCalledTimes(expectedTapperCallsAfterSome[idx]);

				collectToArray(memoized);
				expect(tapperSpy).toHaveBeenCalledTimes(expectedCalls);
			});
	});

	test.each([
		{ start: 0, end: 20 },
		{ start: -10, end: 10 }
	])('memoize(memoize()) keeps the first one - range($start, $end)', ({ start, end }) => {
		const memoized = memoize(tap(range(start, end), tapper));
		const memoizedOfMemoized = memoize(memoized);

		expect(memoizedOfMemoized).toBe(memoized);
	});

	test.each([
		{ start: 0, end: 20 },
		{ start: -10, end: 10 }
	])('memoize(memoize({ allowPartialMemoization: false })) keeps the first one - range($start, $end)', ({ start, end }) => {
		const memoized = memoize(tap(range(start, end), tapper), { allowPartialMemoization: false });
		const memoizedOfMemoized = memoize(memoized, { allowPartialMemoization: false });

		expect(memoizedOfMemoized).toBe(memoized);
	});

	test.each([
		{ start: 0, end: 20, firstAllow: true, secondAllow: false },
		{ start: 0, end: 20, firstAllow: false, secondAllow: true },
		{ start: -10, end: 10, firstAllow: true, secondAllow: false },
		{ start: -10, end: 10, firstAllow: false, secondAllow: true }
	])('memoize(memoize($firstAllow), $secondAllow) changes the memoize iterable - range($start, $end)', ({ start, end, firstAllow, secondAllow }) => {
		const memoized = memoize(tap(range(start, end), tapper), { allowPartialMemoization: firstAllow });
		const memoizedOfMemoized = memoize(memoized, { allowPartialMemoization: secondAllow });

		expect(memoizedOfMemoized).not.toBe(memoized);
	});

});
