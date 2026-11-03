/** The order of the indices of the values, a total order: two different indices are never equal. */
export type IndexOrder = (i: number, j: number) => number;

/** The number of adjacent pairs that the sample compares: one in 32 values, at most 256. */
export function sampleSize(n: number): number {
	return Math.min(256, n >> 5);
}

/** The pairs `(i, i + 1)` of the sample, at evenly spaced fixed positions, that are out of order. */
export function countSampleDescents(n: number, order: IndexOrder): number {
	const sample = sampleSize(n);
	if (sample === 0)
		return 0;
	const step = Math.floor((n - 1) / sample);
	let descents = 0;
	for (let p = 0; p < sample; p++) {
		const i = p * step;
		if (order(i, i + 1) > 0)
			descents++;
	}
	return descents;
}

/**
 * Whether the first `m` of `n` values are found by a partial sort (`select`) or by the full sort (`full`), which is faster when
 * the window is more than a quarter of the values, when the sample is too small to judge (fewer than 8 pairs), when the sample
 * finds the values sorted (the native sort is linear there), or when it finds them nearly sorted and the window is more than
 * one value in 100.
 */
export function choosePath(n: number, m: number, descents: number): 'full' | 'select' {
	const sample = sampleSize(n);
	if (m > n / 4 || sample < 8 || descents === 0 || (descents < sample / 10 && m > n / 100))
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
	const random = positions(indices.length);
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

/** mulberry32 seeded with `n`: deterministic pseudo-random unsigned integers, for the positions of the pivot. */
function positions(n: number): () => number {
	let state = n >>> 0;
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
