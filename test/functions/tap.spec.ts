import { describe, expect, test, vi } from 'vitest';
import { closableSource } from '../_helpers/closableSource';
import { expectTransformation } from '../_helpers/operationKind';

import {
	collectToArray,
	range,
	tap
} from '@/functions';
import { unit } from '@/types';
import { returnClosesTheIterator } from './functionsTestUtility';

describe('tap', () => {

	test.each([
		{ end: 20, returnValue: 'a value' },
		{ end: 20, returnValue: 123 },
		{ end: 20, returnValue: null },
		{ end: 20 }
	])('repeat($value, $count)[Symbol.iterator]().return() closes the iterator', ({ end, returnValue }) => {
		const repeatIterable = tap(range(end), () => unit());
		returnClosesTheIterator(repeatIterable, returnValue);
	});

	test.each([
		{ end: 10, expectedTappedValue: -1 },
		{ end: 10, expectedTappedValue: 5 },
		{ end: 30, expectedTappedValue: 25 }
	])('tap(range($end)) to save $expectedTappedValue from tap', ({ end, expectedTappedValue }) => {
		const tapperSpy = vi.fn(v => {
			if (v === expectedTappedValue)
				tappedValue = expectedTappedValue;
			return unit();
		});
		let tappedValue = -1;
		const tapped = tap(range(end), tapperSpy);

		expect(tapperSpy).not.toHaveBeenCalled();

		collectToArray(tapped);
		expect(tappedValue).toBe(expectedTappedValue);
		expect(tapperSpy).toHaveBeenCalledTimes(end);
	});

	test.each([
		{ end: 10, expectedTappedValue: -1 },
		{ end: 10, expectedTappedValue: 5 },
		{ end: 30, expectedTappedValue: 25 }
	])('tap(range($end)) to save $expectedTappedValue from tap', ({ end, expectedTappedValue }) => {
		const tapperSpy = vi.fn((v, idx) => {
			if (idx === expectedTappedValue)
				tappedValue = v;
			return unit();
		});
		let tappedValue = -1;
		const tapped = tap(range(end), tapperSpy);

		expect(tapperSpy).not.toHaveBeenCalled();

		collectToArray(tapped);
		expect(tappedValue).toBe(expectedTappedValue);
		expect(tapperSpy).toHaveBeenCalledTimes(end);
	});

	test('tap is transformation', () => {
		expectTransformation(source => tap(source, () => unit()));
	});

	test('return() closes the source', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		const it = tap(iterable, () => unit())[Symbol.iterator]();
		it.next();
		it.return!();
		expect(state.closed).toBe(true);
	});

	test('a throwing tapper propagates the same error', () => {
		const err = new Error('boom');
		expect(() => collectToArray(tap([1], () => { throw err; }))).toThrow(err);
	});

});
