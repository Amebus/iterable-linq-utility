/** Test data for the sort specs and benches, and a reference sort written from the rules of ADR 0029 only. */

/** The data patterns: what a sample of adjacent pairs sees, and what the whole array looks like. */
export type Pattern = 'random' | 'sorted' | 'reversed' | 'fewDistinct' | 'clustered' | 'organPipe' | 'sawtooth' | 'sampleSorted' | 'sampleDescending' | 'descentsAt';

/** Every pattern, for the specs that go through all of them. */
export const patterns: Pattern[] = ['random', 'sorted', 'reversed', 'fewDistinct', 'clustered', 'organPipe', 'sawtooth', 'sampleSorted', 'sampleDescending', 'descentsAt'];

export interface IRow {
	id: number;
	g?: number;
	v?: number;
}

/** mulberry32: a seeded generator of numbers in `[0, 1)`. */
export function prng(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6D2B79F5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * The first element of each sampled adjacent pair, as the sample of the partial sort takes them (written again here, not
 * imported): `Math.min(256, n >> 5)` pairs, one in each stride of `floor((n - 1) / sample)` values, at an offset drawn by
 * mulberry32 seeded with `n ^ 0x9E3779B9`. With fewer than 32 values the sample is empty, so the patterns that depend on it
 * are plain sorted data.
 */
export function samplePositions(n: number): number[] {
	const sample = Math.min(256, n >> 5);
	if (sample === 0)
		return [];
	const stride = Math.floor((n - 1) / sample);
	const random = prng((n ^ 0x9E3779B9) >>> 0);
	// prng gives the unsigned integer of mulberry32 divided by 2^32
	return Array.from({ length: sample }, (_, p) => p * stride + (random() * 4294967296) % stride);
}

const ascending = (n: number): number[] => Array.from({ length: n }, (_, i) => i);

function swap(values: number[], i: number): void {
	[values[i], values[i + 1]] = [values[i + 1], values[i]];
}

/** Numbers (non-negative integers) arranged as `pattern`; `descents` is only for `descentsAt`. */
export function numbers(pattern: Pattern, n: number, seed: number, descents = 0): number[] {
	const random = prng(seed);
	switch (pattern) {
		case 'random':
			return Array.from({ length: n }, () => Math.floor(random() * 1_000_000));
		case 'sorted':
			return ascending(n);
		case 'reversed':
			return ascending(n).reverse();
		case 'fewDistinct':
			return Array.from({ length: n }, () => Math.floor(random() * 5));
		case 'clustered':
			// runs of 64 ascending values; each run starts (at 0..39) below the end of the previous one (at least 63)
			return Array.from({ length: n }, (_, i) => ((Math.floor(i / 64) * 37) % 40) + (i % 64));
		case 'organPipe':
			// ascending to the middle, then descending: a pattern that defeats a pivot taken at fixed positions
			return Array.from({ length: n }, (_, i) => Math.min(i, n - 1 - i));
		case 'sawtooth': {
			// ascending ramps of length ceil(sqrt(n))
			const ramp = Math.ceil(Math.sqrt(n));
			return Array.from({ length: n }, (_, i) => i % ramp);
		}
		case 'sampleSorted': {
			const values = Array.from({ length: n }, () => Math.floor(random() * 1_000_000));
			for (const i of samplePositions(n))
				if (values[i] > values[i + 1])
					swap(values, i);
			return values;
		}
		case 'sampleDescending': {
			const values = ascending(n);
			for (const i of samplePositions(n))
				swap(values, i);
			return values;
		}
		case 'descentsAt': {
			const values = ascending(n);
			for (const i of samplePositions(n).slice(0, descents))
				swap(values, i);
			return values;
		}
	}
}

/**
 * Records of `values`: `g = value % 7`, `v = value`. With `missingEvery`, every `missingEvery`-th record has no `g`, every
 * `missingEvery + 1`-th has no `v`, and the element at index `missingEvery * 3` is `null`. `seed` is kept for a uniform
 * signature with the other generators: the layout is deterministic.
 */
export function records(values: number[], _seed: number, missingEvery?: number): IRow[] {
	const rows = values.map((value, i): IRow => {
		const row: IRow = { id: i };
		if (missingEvery === undefined || (i + 1) % missingEvery !== 0)
			row.g = value % 7;
		if (missingEvery === undefined || (i + 1) % (missingEvery + 1) !== 0)
			row.v = value;
		return row;
	});
	// a null element is typed as a row, so that the keys of the rows can be used
	if (missingEvery !== undefined && missingEvery * 3 < rows.length)
		rows[missingEvery * 3] = null as unknown as IRow;
	return rows;
}

/** `null`, `undefined` and `NaN` have no place in the order. */
const isMissing = (value: unknown): boolean => value == null || value !== value;

/** What `sort` takes: nothing (the values), a compare function, a key or a list of keys. */
export type ReferenceComparer<T> = undefined | ((a: T, b: T) => number) | PropertyKey | PropertyKey[];

interface IDecorated<T> {
	value: T;
	index: number;
}

/**
 * The sort of ADR 0029, written from its rules: missing values go last in the order of the source, in both directions, at
 * each level of a list of keys; a compare function decides alone, only `undefined` elements go last without calling it;
 * `descending` inverts the comparison of the present values only; ties keep the order of the source.
 */
export function referenceSort<T>(values: T[], comparer: ReferenceComparer<T>, descending: boolean): T[] {
	const decorated: IDecorated<T>[] = values.map((value, index) => ({ value, index }));
	if (typeof comparer === 'function') {
		const defined = decorated.filter(d => d.value !== undefined);
		const undefinedOnes = decorated.filter(d => d.value === undefined);
		defined.sort((a, b) => comparer(a.value, b.value) || a.index - b.index);
		return [...defined, ...undefinedOnes].map(d => d.value);
	}
	const keys = comparer === undefined ? [undefined] : Array.isArray(comparer) ? comparer : [comparer];
	const read = (d: IDecorated<T>, key: PropertyKey | undefined): unknown =>
		key === undefined ? d.value : d.value == null ? undefined : (d.value as any)[key];
	decorated.sort((a, b) => {
		for (const key of keys) {
			const x = read(a, key);
			const y = read(b, key);
			const xMissing = isMissing(x);
			const yMissing = isMissing(y);
			if (xMissing || yMissing) {
				if (xMissing && yMissing)
					continue;
				return xMissing ? 1 : -1;
			}
			const lower = (x as any) < (y as any);
			const greater = (x as any) > (y as any);
			if (lower || greater)
				return lower === descending ? 1 : -1;
		}
		return a.index - b.index;
	});
	return decorated.map(d => d.value);
}
