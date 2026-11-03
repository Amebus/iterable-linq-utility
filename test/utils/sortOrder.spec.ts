import { describe, expect, test } from 'vitest';
import { type IRow, type Pattern, numbers, prng, records, referenceSort } from '../_helpers/sortData';

import { orderOf } from '@/utils';

const patterns: Pattern[] = ['random', 'sorted', 'reversed', 'fewDistinct', 'clustered', 'sampleSorted', 'sampleDescending', 'descentsAt'];
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
