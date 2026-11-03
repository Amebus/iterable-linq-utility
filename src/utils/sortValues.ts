import type { Comparer } from '../types';
import { compareValues, isMissing, keysOf } from './sortOrder';
import { isPropertyKey } from './selector';
import { isFunction } from './utils';

/** Sorts `values`, which the caller owns, choosing the strategy once, outside the comparisons. */
export function sortValues<T>(values: T[], comparer: Comparer<T> | undefined, descending: boolean): T[] {
	if (comparer === undefined)
		return byValue(values, descending);
	if (isFunction(comparer))
		return values.sort(comparer);
	if (isPropertyKey(comparer))
		return byKey(values, comparer, descending);
	return byKeys(values, comparer as PropertyKey[], descending);
}

const ascendingNumbers = (a: number, b: number): number => a - b;
const descendingNumbers = (a: number, b: number): number => b - a;
const descendingValues = (a: unknown, b: unknown): number => compareValues(b, a);

/** Subtraction when every value is a number, faster than `<` with three outcomes; `Infinity - Infinity` is `NaN`, which the sort reads as equal. */
function compareFor(numbers: boolean, descending: boolean): (a: any, b: any) => number {
	if (numbers)
		return descending ? descendingNumbers : ascendingNumbers;
	return descending ? descendingValues : compareValues;
}

function byValue<T>(values: T[], descending: boolean): T[] {
	const present: T[] = [];
	const missing: T[] = [];
	let numbers = true;
	for (const value of values) {
		if (isMissing(value)) {
			missing.push(value);
		} else {
			present.push(value);
			numbers &&= typeof value === 'number';
		}
	}
	present.sort(compareFor(numbers, descending));
	for (const value of missing)
		present.push(value);
	return present;
}

/**
 * Moves the values whose key is missing out, in one pass, then sorts the others comparing their keys directly: for a property,
 * a read in the comparison is faster than an array of keys and an array of indices.
 */
function byKey<T>(values: T[], key: PropertyKey, descending: boolean): T[] {
	const present: any[] = [];
	const missing: T[] = [];
	let numbers = true;
	for (const value of values) {
		const k = value == null ? undefined : (value as any)[key];
		if (isMissing(k)) {
			missing.push(value);
		} else {
			present.push(value);
			numbers &&= typeof k === 'number';
		}
	}
	present.sort(numbers
		? descending ? (a, b) => b[key] - a[key] : (a, b) => a[key] - b[key]
		: descending ? (a, b) => compareValues(b[key], a[key]) : (a, b) => compareValues(a[key], b[key]));
	for (const value of missing)
		present.push(value);
	return present;
}

/**
 * Without missing keys, the values are compared key by key directly; with one, the keys are read once into one array per key
 * and the indices are sorted, so that a missing key goes after a present one at its level.
 */
function byKeys<T>(values: T[], names: PropertyKey[], descending: boolean): T[] {
	if (names.length === 1)
		return byKey(values, names[0], descending);
	const anyMissing = values.some(value => value == null || names.some(name => isMissing((value as any)[name])));
	if (!anyMissing)
		return values.sort(descending ? (a, b) => compareKeys(b, a, names) : (a, b) => compareKeys(a, b, names));
	const columns = names.map(name => keysOf(values, name));
	const indices: number[] = [];
	for (let i = 0; i < values.length; i++)
		indices.push(i);
	indices.sort(withMissing(columns, descending ? -1 : 1));
	return indices.map(i => values[i]);
}

/** Compares two values key by key; with two keys the reads are written out, which the engine optimises better than a loop. */
function compareKeys(a: any, b: any, names: PropertyKey[]): number {
	if (names.length === 2) {
		const first = names[0];
		let x = a[first];
		let y = b[first];
		if (x < y)
			return -1;
		if (x > y)
			return 1;
		const second = names[1];
		x = a[second];
		y = b[second];
		return x < y ? -1 : x > y ? 1 : 0;
	}
	for (const name of names) {
		const x = a[name];
		const y = b[name];
		if (x < y)
			return -1;
		if (x > y)
			return 1;
	}
	return 0;
}

function withMissing(columns: unknown[][], sign: number): (i: number, j: number) => number {
	return (i, j) => {
		for (const keys of columns) {
			const a = keys[i];
			const b = keys[j];
			const aMissing = isMissing(a);
			const bMissing = isMissing(b);
			if (aMissing || bMissing) {
				if (aMissing && bMissing)
					continue;
				return aMissing ? 1 : -1;
			}
			const result = compareValues(a, b);
			if (result !== 0)
				return sign * result;
		}
		return 0;
	};
}
