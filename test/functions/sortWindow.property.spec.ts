import { afterAll, beforeAll, describe, expect, type MockInstance, test, vi } from 'vitest';
import { type IRow, numbers, type Pattern, records, referenceSort } from '../_helpers/sortData';

import { collectToArray, skip, slice, sort, take } from '@/functions';
import type { Comparer } from '@/types';
import { orderOf, PartialSort } from '@/utils';

const sizes = [255, 256, 1000, 1023, 1024, 4096];
const seeds = [1, 2, 3];

/**
 * A pattern, and its `k`: for `descentsAt` the number of descents (2, 3, 4, and the counts either side of a tenth of the
 * sample), for `reversedRuns` the length of the runs. The descending comparers read `descentsAt` as nearly reversed.
 */
interface ICase {
	pattern: Pattern;
	descents?: number;
}

const cases: ICase[] = [
	{ pattern: 'random' },
	{ pattern: 'sorted' },
	{ pattern: 'reversed' },
	{ pattern: 'fewDistinct' },
	{ pattern: 'clustered' },
	{ pattern: 'organPipe' },
	{ pattern: 'sawtooth' },
	{ pattern: 'sampleSorted' },
	{ pattern: 'sampleDescending' },
	{ pattern: 'descentsAt', descents: 2 },
	{ pattern: 'descentsAt', descents: 3 },
	{ pattern: 'descentsAt', descents: 4 },
	{ pattern: 'descentsAt', descents: -1 },
	{ pattern: 'reversedRuns', descents: 4 },
	{ pattern: 'reversedRuns', descents: 100 },
	{ pattern: 'ascendingRuns', descents: 8 },
	{ pattern: 'descendingRuns', descents: 12 },
	{ pattern: 'ascendingRuns', descents: 1000 }
];

const labelOf = ({ pattern, descents }: ICase): string =>
	descents === undefined ? pattern : `${pattern} ${descents === -1 ? 'about a tenth of the sample' : descents}`;

/** `-1` stands for the counts just below and just above a tenth of the sample of `n`. */
const descentCounts = (n: number, descents: number): number[] => {
	if (descents !== -1)
		return [descents];
	const tenth = PartialSort.sampleSize(n) / 10;
	return [...new Set([Math.floor(tenth), Math.ceil(tenth), Math.ceil(tenth) + 1])].filter(k => k > 0);
};

/** The `a + b` around a quarter, the threshold of the rule, small windows, one value in 100, and past the end. */
const totals = (n: number): number[] => [...new Set([
	1, 10, Math.floor(n / 100), Math.floor(n / 100) + 1, Math.floor(n / 4) - 1, Math.floor(n / 4), Math.floor(n / 4) + 1,
	Math.floor(n / 2), n, n + 5
])];

/** The windows `[a, a + b)` of a total: from the start, after one value, and the last value of the total alone. */
const windows = (total: number): [number, number][] =>
	[...new Set([0, 1, total - 1])].filter(a => a >= 0 && a <= total).map(a => [a, total - a]);

/** The four forms, in turn, so that every form meets every kind of window. */
const forms = [
	(s: Iterable<unknown>, a: number, b: number) => (a === 0 ? take(s, b) : take(skip(s, a), b)),
	(s: Iterable<unknown>, a: number, b: number) => slice(s, a, a + b),
	(s: Iterable<unknown>, a: number, b: number) => slice(skip(s, a), 0, b),
	(s: Iterable<unknown>, a: number, b: number) => take(slice(s, a), b)
];

interface IComparer {
	name: string;
	data: (values: number[], seed: number) => unknown[];
	comparer: Comparer<any> | undefined;
	descending: boolean;
}

const byV = (x: IRow, y: IRow) => x.v! - y.v!;

const comparers: IComparer[] = [
	{ name: 'values', data: values => values, comparer: undefined, descending: false },
	{ name: 'values descending', data: values => values, comparer: undefined, descending: true },
	{ name: 'a key with missing ones', data: (values, seed) => records(values, seed, 5), comparer: 'v', descending: false },
	{ name: 'a key with missing ones, descending', data: (values, seed) => records(values, seed, 5), comparer: 'v', descending: true },
	{ name: 'two keys with missing ones', data: (values, seed) => records(values, seed, 5), comparer: ['g', 'v'], descending: false },
	{ name: 'two keys with missing ones, descending', data: (values, seed) => records(values, seed, 5), comparer: ['g', 'v'], descending: true },
	{ name: 'a compare function', data: (values, seed) => records(values, seed), comparer: byV, descending: false }
];

/**
 * Why the rule takes its path, independently of `choosePath`, to check that every branch is taken: the sample sorted in either
 * direction, or nearly sorted (fewer than a tenth of the pairs descend) or nearly reversed (fewer than a tenth ascend), each
 * in long runs (fewer than a third of the pairs at distance 32 go the other way); in short runs (`short runs`) the partial sort.
 */
type Branch = 'threshold' | 'small sample' | 'sorted either way' | 'nearly sorted' | 'nearly reversed' | 'short runs' | 'select';

function branchOf(n: number, m: number, descents: number, longDescents: number): Branch {
	const sample = Math.min(256, n >> 5);
	if (m > n / 4)
		return 'threshold';
	if (sample < 8)
		return 'small sample';
	const far = (d: number, part: number) => d >= sample / part && sample - d >= sample / part;
	if (!far(descents, 10))
		return far(longDescents, 3) ? 'short runs' : descents === 0 || descents === sample ? 'sorted either way' : descents < sample / 10 ? 'nearly sorted' : 'nearly reversed';
	return 'select';
}

/** `sort` with the arguments of its overloads: options only with no comparer or a key. */
function sortBy(source: unknown[], comparer: Comparer<any> | undefined, descending: boolean): Iterable<unknown> {
	if (comparer === undefined)
		return sort(source, { descending });
	if (typeof comparer === 'function')
		return sort(source, comparer);
	return sort(source, comparer as never, { descending });
}

const identity = (value: unknown) => (value !== null && typeof value === 'object' ? (value as IRow).id : value);
const branches = new Map<Branch, number>();
let selectWindow: MockInstance<typeof PartialSort.selectWindow>;

beforeAll(() => {
	selectWindow = vi.spyOn(PartialSort, 'selectWindow');
});

afterAll(() => {
	selectWindow.mockRestore();
});

describe('take, skip and slice after sort against the reference', () => {
	describe.each(cases.map(c => ({ ...c, label: labelOf(c) })))('$label', ({ pattern, descents }) => {
		test.each(sizes)('n = %i', n => {
			const failures: string[] = [];
			let form = 0;
			for (const k of descentCounts(n, descents ?? 0)) {
				for (const seed of seeds) {
					const values = numbers(pattern, n, seed, k);
					for (const { name, data, comparer, descending } of comparers) {
						const source = data(values, seed);
						const expected = referenceSort(source, comparer as never, descending).map(identity);
						const order = orderOf(source, comparer as Comparer<unknown> | undefined, descending);
						const sampleDescents = PartialSort.countSampleDescents(n, order);
						const longDescents = PartialSort.countLongSampleDescents(n, order);
						const sorted = sortBy(source, comparer, descending);
						for (const total of totals(n)) {
							for (const [a, b] of windows(total)) {
								const m = Math.min(a + b, n);
								const path = a < m ? PartialSort.choosePath(n, m, sampleDescents, longDescents) : 'none';
								selectWindow.mockClear();
								const actual = collectToArray(forms[form++ % forms.length](sorted, a, b)).map(identity);
								const label = `k ${k}, seed ${seed}, ${name}, [${a}, ${a + b})`;
								if (actual.length !== Math.max(0, m - a) || actual.some((value, i) => !Object.is(value, expected[a + i])))
									failures.push(`${label}: not the reference`);
								if (selectWindow.mock.calls.length !== (path === 'select' ? 1 : 0))
									failures.push(`${label}: ${selectWindow.mock.calls.length} partial sorts for the path ${path}`);
								if (selectWindow.mock.results.some(result => result.value === undefined))
									failures.push(`${label}: the partial sort gave up on a consistent order`);
								// the offset alone, without a window: the full sort, skipping `a`
								if (a === total - 1 && a > 0) {
									const rest = collectToArray(skip(sorted, a)).map(identity);
									if (rest.length !== Math.max(0, n - a) || rest.some((value, i) => !Object.is(value, expected[a + i])))
										failures.push(`${label}: skip alone is not the reference`);
								}
								if (path !== 'none') {
									const branch = branchOf(n, m, sampleDescents, longDescents);
									if ((branch === 'select' || branch === 'short runs') !== (path === 'select'))
										failures.push(`${label}: choosePath says ${path}, the rule says ${branch}`);
									branches.set(branch, (branches.get(branch) ?? 0) + 1);
								}
							}
						}
					}
				}
			}
			expect(failures).toEqual([]);
		});
	});

	test('every branch of the rule is taken', () => {
		expect([...branches.keys()].sort()).toEqual(['nearly reversed', 'nearly sorted', 'select', 'short runs', 'small sample', 'sorted either way', 'threshold']);
	});

	test.each(seeds)('the sample of clustered data at 4096 values sees the runs end (seed %i)', seed => {
		const values = numbers('clustered', 4096, seed);
		expect(PartialSort.countSampleDescents(4096, orderOf(values, undefined, false))).toBeGreaterThan(0);
		expect(PartialSort.countSampleDescents(4096, orderOf(values, undefined, false))).toBeLessThan(PartialSort.sampleSize(4096) / 10);
		// runs of 64: the pairs at distance 32 straddle two runs half the time, so the partial sort
		const longDescents = PartialSort.countLongSampleDescents(4096, orderOf(values, undefined, false));
		expect(longDescents).toBeGreaterThanOrEqual(PartialSort.sampleSize(4096) / 3);
		expect(PartialSort.sampleSize(4096) - longDescents).toBeGreaterThanOrEqual(PartialSort.sampleSize(4096) / 3);
		selectWindow.mockClear();
		expect(collectToArray(take(sort(values), 10))).toEqual(values.toSorted((x, y) => x - y).slice(0, 10));
		expect(selectWindow).toHaveBeenCalledTimes(1);
	});
});
