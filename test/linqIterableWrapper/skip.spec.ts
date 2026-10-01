import { describe, expect, test } from 'vitest';
import { closableSource } from '../_helpers/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { expectTransformation } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('IterableLinq.skip', () => {

	test.each([-1, 2.5, NaN, Infinity, -Infinity, undefined, null, '2', {}, true])('rejects count %s', count => {
		expect(() => IterableLinq.fromRange(5).skip(count as any)).toThrow('The "count" parameter must be a non-negative integer');
	});

	test.each([
		{ end: 0, count: 0, expected: [] },
		{ end: 0, count: 3, expected: [] },
		{ end: 5, count: 0, expected: [0, 1, 2, 3, 4] },
		{ end: 5, count: 1, expected: [1, 2, 3, 4] },
		{ end: 5, count: 3, expected: [3, 4] },
		{ end: 5, count: 5, expected: [] },
		{ end: 5, count: 10, expected: [] }
	])('fromRange($end).skip($count) -> $expected', ({ end, count, expected }) => {
		expect(IterableLinq.fromRange(end).skip(count).collectToArray()).toEqual(expected);
	});

	test('is a lazy, re-runnable Transformation', () => {
		expectTransformation(source => IterableLinq.from(source).skip(2));
	});

	test('composes with filter, take and map', () => {
		expect(IterableLinq.fromRange(20).filter(v => v % 2 === 0).skip(2).take(3).map(v => v * 10).collectToArray()).toEqual([40, 60, 80]);
	});

	test('reads an infinite source only as far as its consumer needs', () => {
		const { stats, iterable } = infiniteSource(5);
		expect(IterableLinq.from(iterable).skip(3).take(2).collectToArray()).toEqual([3, 4]);
		expect(stats.reads).toBe(5);
	});

	test('closes the source when the consumer stops early', () => {
		const { state, iterable } = closableSource([0, 1, 2, 3]);
		expect(IterableLinq.from(iterable).skip(2).take(1).collectToArray()).toEqual([2]);
		expect(state.closed).toBe(true);
	});

});
