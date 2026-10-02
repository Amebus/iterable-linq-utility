import { describe, expect, test } from 'vitest';

import { infiniteSource } from './infiniteSource';

function read(iterable: Iterable<number>, count: number): number[] {
	const values: number[] = [];
	for (const value of iterable) {
		values.push(value);
		if (values.length === count)
			break;
	}
	return values;
}

describe('infiniteSource', () => {

	test('yields 0, 1, 2, … and counts the reads', () => {
		const { stats, iterable } = infiniteSource();
		expect(read(iterable, 3)).toEqual([0, 1, 2]);
		expect(stats.reads).toBe(3);
	});

	test('every iteration starts from 0, and the reads add up', () => {
		const { stats, iterable } = infiniteSource();
		read(iterable, 2);
		expect(read(iterable, 2)).toEqual([0, 1]);
		expect(stats.reads).toBe(4);
	});

	test('is closed when the consumer stops', () => {
		const { stats, iterable } = infiniteSource();
		const it = iterable[Symbol.iterator]();
		it.next();
		expect(stats.closed).toBe(false);
		it.return!();
		expect(stats.closed).toBe(true);
	});

	test('throws past maxReads, so a test that does not stop fails', () => {
		const { stats, iterable } = infiniteSource(5);
		expect(() => Array.from(iterable)).toThrow('infiniteSource: read more than 5 values');
		expect(stats).toEqual({ reads: 6, closed: true });
	});

});
