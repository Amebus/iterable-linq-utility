import { describe, expect, test, vi } from 'vitest';
import { expectTransformation } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';
import { Functions } from '@/index';
import { unit } from '@/types';

const tapper = () => unit();

describe('IterableLinq.memoize', () => {

	test.each([
		{ allowPartialMemoization: true },
		{ allowPartialMemoization: false }
	])('IterableLinq.memoize($allowPartialMemoization) is transformation that does not re-run the source', ({ allowPartialMemoization }) => {
		expectTransformation(source => IterableLinq.from(source).memoize({ allowPartialMemoization }), { rerunsSource: false });
	});

	test.each([
		{ start: 0, end: 0, expectedTapperCalls: [0,0,0,0] },
		{ start: 0, end: 20, expectedTapperCalls: [20,20,20,20] },
		{ start: -10, end: 10, expectedTapperCalls: [20,20,20,20] },
		{ start: 0, end: 20, expectedTapperCalls: [20,20,20,20], allowPartialMemoization: false },
		{ start: -10, end: 10, expectedTapperCalls: [20,20,20,20], allowPartialMemoization: false }
	])('IterableLinq.memoize() saves data - IterableLinq.fromRange($start, $end)', ({ start, end, expectedTapperCalls, allowPartialMemoization }) => {
		const tapperSpy = vi.fn(tapper);
		const memoized = IterableLinq
			.fromRange(start,end)
			.tap(tapperSpy)
			.memoize({ allowPartialMemoization });
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
	])('IterableLinq.memoize() partially saves data - IterableLinq.fromRange($start, $end)', ({ start, end, expectedTapperCalls, expectedSomeCalls, expectedTapperCallsAfterSome }) => {
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
		{ start: 0, end: 20, expectedTapperCalls: [20,20,20,20], expectedSomeCalls: [2,2,2,2], expectedTapperCallsAfterSome: [2,20,20,20] },
		{ start: -10, end: 10, expectedTapperCalls: [20,20,20,20], expectedSomeCalls: [12,12,12,12], expectedTapperCallsAfterSome: [12,20,20,20] }
	])('IterableLinq.memoize({ allowPartialMemoization: false }).memoize() partially saves data - IterableLinq.fromRange($start, $end)', ({ start, end, expectedTapperCalls, expectedSomeCalls, expectedTapperCallsAfterSome }) => {
		const tapperSpy = vi.fn(tapper);
		const memoized = IterableLinq
			.fromRange(start,end)
			.tap(tapperSpy)
			.memoize({ allowPartialMemoization: false })
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
	])('IterableLinq.memoize({ allowPartialMemoization: false }) fully saves data - IterableLinq.fromRange($start, $end)', ({ start, end, expectedTapperCalls, expectedSomeCalls, expectedTapperCallsAfterSome }) => {
		const tapperSpy = vi.fn(tapper);
		const memoized = IterableLinq
			.fromRange(start,end)
			.tap(tapperSpy)
			.memoize({ allowPartialMemoization: false });
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
	])('IterableLinq.memoize().memoize({ allowPartialMemoization: false }) fully saves data - IterableLinq.fromRange($start, $end)', ({ start, end, expectedTapperCalls, expectedSomeCalls, expectedTapperCallsAfterSome }) => {
		const tapperSpy = vi.fn(tapper);
		const memoized = IterableLinq
			.fromRange(start,end)
			.tap(tapperSpy)
			.memoize()
			.memoize({ allowPartialMemoization: false });
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
		{ allowPartialMemoization: false, readFirst: false },
		{ allowPartialMemoization: true, readFirst: true }
	])('the Actions after a finished memoize($allowPartialMemoization) read the cache without iterating it', ({ allowPartialMemoization, readFirst }) => {
		const memoized = IterableLinq.from([1, 5, 2, 5]).memoize({ allowPartialMemoization });
		// a partial memoize is finished once read to the end; a full one is filled by the first Action
		if (readFirst)
			expect([...memoized]).toEqual([1, 5, 2, 5]);
		const prototype = Object.getPrototypeOf(Functions.memoize([], { allowPartialMemoization }));
		const iterator = vi.spyOn(prototype, Symbol.iterator);
		try {
			expect(memoized.count()).toBe(4);
			expect(memoized.at(-1)).toBe(5);
			const predicate = vi.fn((value: number) => value > 4);
			expect(memoized.findLastIndex(predicate)).toBe(3);
			expect(predicate.mock.calls).toEqual([[5, 3]]);
			expect(iterator).not.toHaveBeenCalled();
		} finally {
			iterator.mockRestore();
		}
	});

});
