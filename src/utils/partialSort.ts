/** The order of the indices of the values, a total order: two different indices are never equal. */
export type IndexOrder = (i: number, j: number) => number;

/**
 * The number of adjacent pairs that the sample compares: one in 32 values, at most 256. They are taken one per stride of
 * `floor((n - 1) / sample)` values, at a pseudo-random offset in it (see `countSampleDescents`).
 */
export function sampleSize(n: number): number {
	return Math.min(256, n >> 5);
}

/** The seed of the offsets of the sample, so that they do not follow the positions of the pivot, seeded with `n`. */
const sampleSeed = 0x9E3779B9;

/**
 * The distance of the pairs of the second sample: the scale of the minimum run of the native sort (32 to 64 values). It
 * finds the runs at least that long in about linear time, and sorts the shorter ones by insertion and merges them, at about
 * `n log(n / run)`, so data in short runs is not cheap for it even when its adjacent pairs look sorted or reversed.
 */
export const longSampleGap = 32;

/** The seed of the offsets of the second sample, so that its positions do not follow those of the first one. */
const longSampleSeed = 0x85EBCA6B;

/**
 * The pairs `(i, i + 1)` of the sample that are out of order. The sample is stratified: one pair in each stride of
 * `floor((n - 1) / sample)` values, at an offset drawn by a generator seeded with `n`, so the same input takes the same path.
 * Positions at a fixed step would always read periodic data at the same phase: with a period that divides the step, every
 * pair would ascend (no descent, the full sort on data the partial sort is for) or straddle the end of a ramp (only descents,
 * the partial sort on data in a few long runs).
 */
export function countSampleDescents(n: number, order: IndexOrder): number {
	return countDescents(n, order, 1, sampleSeed);
}

/**
 * The pairs `(i, i + 32)` of the second sample that are out of order, as many as the pairs of the first one, one in each
 * stride of `floor((n - 32) / sample)` values, at an offset drawn with another seed. In runs much longer than 32 values most
 * pairs are in one run and go the same way as the adjacent ones; in shorter runs most of them straddle two runs, and at
 * unrelated levels about half descend. `0` when there are fewer positions with a pair than the sample.
 */
export function countLongSampleDescents(n: number, order: IndexOrder): number {
	return countDescents(n, order, longSampleGap, longSampleSeed);
}

function countDescents(n: number, order: IndexOrder, gap: number, seed: number): number {
	const sample = sampleSize(n);
	if (sample === 0 || n - gap < sample)
		return 0;
	const stride = Math.floor((n - gap) / sample);
	const random = mulberry32((n ^ seed) >>> 0);
	let descents = 0;
	for (let p = 0; p < sample; p++) {
		// sample * stride <= n - gap, so the last position is at most n - gap - 1 and its pair is in the values
		const i = p * stride + random() % stride;
		if (order(i, i + gap) > 0)
			descents++;
	}
	return descents;
}

/** Fewer than a tenth of the pairs of the sample descend, or fewer than a tenth ascend. */
const nearlySorted = (descents: number, sample: number): boolean => Math.min(descents, sample - descents) < sample / 10;

/**
 * Fewer than a third of the pairs at distance 32 go the other way. Runs laid out in order, or in blocks, keep most of those
 * pairs on one side even when they are not long: ascending runs in descending order give about `sample * 32 / run` descents.
 * The partial sort does two to four times the comparisons of the full sort there, from runs of 128 values. Short runs at
 * unrelated levels, where it gains, give about half.
 */
const longRuns = (longDescents: number, sample: number): boolean => Math.min(longDescents, sample - longDescents) < sample / 3;

/**
 * Whether the first `m` of `n` values are found by a partial sort (`select`) or by the full sort (`full`), which is faster when
 * the window is more than a quarter of the values, when the sample is too small to judge (fewer than 8 pairs), or when the
 * values are sorted or nearly sorted in either direction in long runs. The native sort finds the runs there, ascending or
 * descending, in about linear time, whatever the window. The first sample, of adjacent pairs, says whether the values look
 * nearly sorted in either direction; when they do, `longDescents`, the descents of the second sample at distance 32, says
 * whether the runs are long, or short: the partial sort. Without `longDescents` the first sample decides alone.
 */
export function choosePath(n: number, m: number, descents: number, longDescents?: number): 'full' | 'select' {
	const sample = sampleSize(n);
	if (m > n / 4 || sample < 8)
		return 'full';
	if (nearlySorted(descents, sample) && (longDescents === undefined || longRuns(longDescents, sample)))
		return 'full';
	return 'select';
}

/**
 * The work that the quickselect may do, in values partitioned (about one comparison each), before it gives up. With the
 * pseudo-random pivot a consistent order needs about `2 * n` to `4 * n`: at most `4.96 * n` measured on the random, sorted,
 * reversed, few distinct, clustered, organ pipe, sawtooth, sample sorted, sample descending and few descents patterns, at
 * 1,000 to 100,000 values, 5 seeds, by value both ways, by a key and by two keys with missing ones, with windows up to a
 * quarter. An inconsistent compare function can need up to `n * m`. A consistent order that still reaches the budget gets
 * the full sort: the result is the same, at the cost of at most the budget of extra work.
 */
export const selectBudget = (n: number): number => 8 * n;

/**
 * The indices of the positions `[start, end)` of `order`, with `0 <= start < end <= n`: a quickselect moves the `end` smallest
 * indices first, then the native sort orders them. `undefined` when the quickselect exceeds `selectBudget(n)`, which a
 * consistent order does not reach: the caller then sorts the whole values.
 */
export function selectWindow(n: number, order: IndexOrder, start: number, end: number): number[] | undefined {
	const indices: number[] = new Array(n);
	for (let i = 0; i < n; i++)
		indices[i] = i;
	if (!selectFirst(indices, order, end, selectBudget(n)))
		return undefined;
	indices.length = end;
	indices.sort(order);
	return start === 0 ? indices : indices.slice(start);
}

/**
 * Hoare's quickselect: afterwards `indices[0, m)` are the `m` smallest, in no order. The pivot is the median of three indices
 * at pseudo-random positions of the range, so that no arrangement of the data (organ pipe, sawtooth) defeats it, and the same
 * input takes the same path. The scans stay in the range, so that an inconsistent order ends; `false` when the values
 * partitioned exceed `budget`.
 */
function selectFirst(indices: number[], order: IndexOrder, m: number, budget: number): boolean {
	const k = m - 1;
	let left = 0;
	let right = indices.length - 1;
	let work = 0;
	const random = mulberry32(indices.length);
	while (left < right) {
		work += right - left + 1;
		if (work > budget)
			return false;
		const span = right - left + 1;
		const pivot = medianOf(order, indices[left + random() % span], indices[left + random() % span], indices[left + random() % span]);
		let i = left;
		let j = right;
		while (i <= j) {
			while (i < right && order(indices[i], pivot) < 0)
				i++;
			while (j > left && order(indices[j], pivot) > 0)
				j--;
			if (i <= j) {
				swap(indices, i, j);
				i++;
				j--;
			}
		}
		// [left, j] precede the pivot or are it, [i, right] follow it or are it; between them, the pivot in its place
		if (k <= j)
			right = j;
		else if (k >= i)
			left = i;
		else
			return true;
	}
	return true;
}

/** The median of three indices in `order`. */
function medianOf(order: IndexOrder, a: number, b: number, c: number): number {
	if (order(a, b) < 0) {
		if (order(b, c) < 0)
			return b;
		return order(a, c) < 0 ? c : a;
	}
	if (order(a, c) < 0)
		return a;
	return order(b, c) < 0 ? c : b;
}

/** mulberry32: deterministic pseudo-random unsigned integers, for the positions of the pivot and of the sample. */
function mulberry32(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6D2B79F5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return (t ^ (t >>> 14)) >>> 0;
	};
}

function swap(indices: number[], i: number, j: number): void {
	const value = indices[i];
	indices[i] = indices[j];
	indices[j] = value;
}
