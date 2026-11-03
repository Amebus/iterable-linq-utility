import { describe, expect, test } from 'vitest';
import { type IRow, numbers, patterns, prng, records, referenceSort, samplePositions } from '../_helpers/sortData';

import { orderOf, pairOrderOf } from '@/utils';

const n = 1000;
const seed = 7;
const ids = (rows: (IRow | null | undefined)[]) => rows.map(row => row?.id ?? row);

/** The values in the order of `orderOf`, sorting the indices with it. */
function sortedBy<T>(values: T[], order: (i: number, j: number) => number): T[] {
	return Array.from(values.keys()).sort(order).map(i => values[i]);
}

describe('orderOf', () => {
	describe.each(patterns)('%s', pattern => {
		const values = numbers(pattern, n, seed, 4);
		const missing = records(values, seed, 5);
		const complete = records(values, seed);

		test.each([false, true])('descending %s', descending => {
			expect(sortedBy(values, orderOf(values, undefined, descending))).toEqual(referenceSort(values, undefined, descending));
			expect(ids(sortedBy(missing, orderOf(missing, 'v', descending)))).toEqual(ids(referenceSort(missing, 'v', descending)));
			expect(ids(sortedBy(missing, orderOf(missing, ['v'], descending)))).toEqual(ids(referenceSort(missing, ['v'], descending)));
			expect(ids(sortedBy(missing, orderOf(missing, ['g', 'v'], descending)))).toEqual(ids(referenceSort(missing, ['g', 'v'], descending)));
		});

		test('a compare function, which decides alone', () => {
			const compare = (x: IRow, y: IRow) => y.v! - x.v!;
			expect(ids(sortedBy(complete, orderOf(complete, compare, true)))).toEqual(ids(referenceSort(complete, compare, false)));
		});
	});

	test.each([false, true])('values that are not numbers, missing ones and NaN, descending %s', descending => {
		const values = ['b', null, 'a', NaN, undefined, 'c', 'a', new Date(1) as unknown as string, 'b'];
		expect(sortedBy(values, orderOf(values, undefined, descending))).toEqual(referenceSort(values, undefined, descending));
		const dates = [new Date(2), new Date(1), new Date(2), new Date(1)];
		expect(sortedBy(dates, orderOf(dates, undefined, descending))).toEqual(referenceSort(dates, undefined, descending));
	});

	test('a compare function puts the undefined elements last without calling it, in the order of the source', () => {
		const first = { id: 1, v: 2 };
		const second = { id: 2, v: 1 };
		const values: (IRow | undefined)[] = [undefined, first, undefined, second];
		const compare = (x: IRow | undefined, y: IRow | undefined) => x!.v! - y!.v!;
		expect(sortedBy(values, orderOf(values, compare, false))).toEqual([second, first, undefined, undefined]);
	});

	test('a compare function receives the null elements: only the undefined ones go last without a call', () => {
		const calls: unknown[] = [];
		const values: (number | null | undefined)[] = [2, null, undefined, 0, null];
		const compare = (x: number | null | undefined, y: number | null | undefined) => (calls.push(x, y), (x ?? 1) - (y ?? 1));
		const sorted = sortedBy(values, orderOf(values, compare, false));
		expect(calls).toContain(null);
		expect(calls).not.toContain(undefined);
		expect(sorted).toEqual([0, null, null, 2, undefined]);
	});

	test('an index is equal to itself without calling the compare function', () => {
		let calls = 0;
		const order = orderOf([1, 2], () => (calls++, -1), false);
		expect(order(0, 0)).toBe(0);
		expect(order(1, 1)).toBe(0);
		expect(calls).toBe(0);
		expect(orderOf([NaN, Infinity], undefined, false)(1, 1)).toBe(0);
	});

	test('is antisymmetric and never 0 for two different indices', () => {
		const values = numbers('fewDistinct', n, seed);
		const rows = records(values, seed, 5);
		const orders = [orderOf(values, undefined, false), orderOf(rows, 'v', true), orderOf(rows, ['g', 'v'], false), orderOf(rows, (x, y) => (x?.g ?? 0) - (y?.g ?? 0), false)];
		const random = prng(seed);
		for (let pair = 0; pair < 200; pair++) {
			const i = Math.floor(random() * n);
			let j = Math.floor(random() * n);
			if (j === i)
				j = (i + 1) % n;
			for (const order of orders) {
				expect(order(i, j)).not.toBe(0);
				expect(Math.sign(order(i, j))).toBe(-Math.sign(order(j, i)));
			}
		}
	});
});

describe('pairOrderOf', () => {
	const compare = (x: IRow | null, y: IRow | null) => (x?.v ?? -1) - (y?.v ?? -1);
	const comparers: [string, unknown][] = [['the values', undefined], ['a key', 'v'], ['a list of one key', ['v']], ['two keys', ['g', 'v']], ['a compare function', compare]];

	describe.each(patterns)('agrees with orderOf on the sampled pairs and on random pairs: %s', pattern => {
		test.each(comparers)('%s', (_, comparer) => {
			for (const n of [1000, 4096]) {
				const values = numbers(pattern, n, seed, 4);
				const source: unknown[] = comparer === undefined ? [...values, null, NaN, undefined, 3, 'a', 'b', 3] : records(values, seed, 5);
				if (typeof comparer === 'function')
					source[7] = undefined;
				const random = prng(n);
				const pairs: [number, number][] = [
					...samplePositions(n).map((i): [number, number] => [i, i + 1]),
					...Array.from({ length: 300 }, (): [number, number] => [Math.floor(random() * source.length), Math.floor(random() * source.length)]),
					[0, 0],
					[source.length - 1, source.length - 2]
				];
				for (const descending of [false, true]) {
					const full = orderOf(source, comparer as never, descending);
					const pair = pairOrderOf(source, comparer as never, descending);
					for (const [i, j] of pairs)
						expect([i, j, Math.sign(pair(i, j))]).toEqual([i, j, Math.sign(full(i, j))]);
				}
			}
		});
	});

	test('reads only the two values it compares, and their keys', () => {
		let reads = 0;
		const rows = Array.from({ length: 100 }, (_, i) => ({
			get v() {
				reads++;
				return i % 7;
			},
			g: 0
		}));
		for (const comparer of ['v', ['v'], ['g', 'v'], (x: { v: number }, y: { v: number }) => x.v - y.v] as const) {
			reads = 0;
			const order = pairOrderOf(rows, comparer as never, false);
			expect(reads).toBe(0);
			order(3, 4);
			expect(reads).toBe(2);
			expect(order(5, 5)).toBe(0);
			expect(reads).toBe(2);
		}
	});
});
