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
 * The indices of the positions `[start, end)` of `order`, with `0 <= start < end <= n`: a quickselect moves the `end` smallest
 * indices first, then the native sort orders them.
 */
export function selectWindow(n: number, order: IndexOrder, start: number, end: number): number[] {
	const indices: number[] = new Array(n);
	for (let i = 0; i < n; i++)
		indices[i] = i;
	selectFirst(indices, order, end);
	indices.length = end;
	indices.sort(order);
	return start === 0 ? indices : indices.slice(start);
}

/** Hoare's quickselect with a median of three: afterwards `indices[0, m)` are the `m` smallest, in no order. */
function selectFirst(indices: number[], order: IndexOrder, m: number): void {
	const k = m - 1;
	let left = 0;
	let right = indices.length - 1;
	while (left < right) {
		const middle = (left + right) >>> 1;
		if (order(indices[middle], indices[left]) < 0)
			swap(indices, left, middle);
		if (order(indices[right], indices[left]) < 0)
			swap(indices, left, right);
		if (order(indices[right], indices[middle]) < 0)
			swap(indices, middle, right);
		const pivot = indices[middle];
		let i = left;
		let j = right;
		while (i <= j) {
			while (order(indices[i], pivot) < 0)
				i++;
			while (order(indices[j], pivot) > 0)
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
			return;
	}
}

function swap(indices: number[], i: number, j: number): void {
	const value = indices[i];
	indices[i] = indices[j];
	indices[j] = value;
}
