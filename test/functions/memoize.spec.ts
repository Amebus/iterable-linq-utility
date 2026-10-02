import { describe, expect, test, vi } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectTransformation } from '../_helpers/operationKind';

import {
	collectToArray,
	map,
	memoize,
	range,
	some,
	tap
} from '@/functions';
import { unit } from '@/types';
import { returnClosesTheIterator, withoutInputIterableThrowsException } from './functionsTestUtility';

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
		{ start: -10, end: 10 },
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
		{ start: -10, end: 10, expectedTapperCalls: [20,20,20,20] },
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

	test.each([
		{ allowPartialMemoization: true },
		{ allowPartialMemoization: false }
	])('memoize($allowPartialMemoization) is transformation that does not re-run the source', ({ allowPartialMemoization }) => {
		expectTransformation(source => memoize(source, { allowPartialMemoization }), { rerunsSource: false });
	});

	test('partial: break then full read completes the cache', () => {
		const m = memoize(closableSource([1, 2, 3, 4, 5]).iterable);
		for (const v of m)
			if (v === 2) break;
		expect(collectToArray(m)).toEqual([1, 2, 3, 4, 5]);
	});

	test('partial: interleaved consumers see every value', () => {
		const m = memoize([1, 2, 3, 4]);
		const a = m[Symbol.iterator]();
		const b = m[Symbol.iterator]();
		expect([a.next(), b.next(), a.next(), b.next()].map(r => r.value)).toEqual([1, 1, 2, 2]);
	});

	test('full: concurrent consumers evaluate the source once', () => {
		const tapperSpy = vi.fn(tapper);
		const m = memoize(tap([1, 2, 3, 4, 5], tapperSpy), { allowPartialMemoization: false });
		const a = m[Symbol.iterator]();
		const b = m[Symbol.iterator]();
		a.next();
		b.next();
		const rest = (it: Iterator<number>) => {
			const values: number[] = [];
			for (let n = it.next(); n.done !== true; n = it.next())
				values.push(n.value);
			return values;
		};
		expect(rest(a)).toEqual([2, 3, 4, 5]);
		expect(rest(b)).toEqual([2, 3, 4, 5]);
		expect(tapperSpy).toHaveBeenCalledTimes(5);
	});

	test('partial: consumer return() does not close the shared source', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		const m = memoize(iterable);
		for (const v of m)
			if (v === 1) break;
		expect(state.closed).toBe(false);
		collectToArray(m);
		expect(state.closed).toBe(true);
	});

	test.each([true, false])('memoize(partial: %s) re-throws a source error to later consumers', allowPartialMemoization => {
		const err = new Error('boom');
		const { iterable } = throwingSource(3, err);
		const m = memoize(iterable, { allowPartialMemoization });
		expect(() => collectToArray(m)).toThrow(err);
		expect(() => collectToArray(m)).toThrow(err);
	});

	test('memoize does not drop the value whose mapper threw', () => {
		const err = new Error('boom');
		let calls = 0;
		const m = memoize(map([1, 2, 3], v => { if (v === 2 && calls++ === 0) throw err; return v; }));
		expect(() => collectToArray(m)).toThrow(err);
		expect(() => collectToArray(m)).toThrow(err);
	});

});
