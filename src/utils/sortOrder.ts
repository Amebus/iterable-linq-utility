import type { Comparer } from '../types';
import { isPropertyKey } from './selector';
import { isFunction } from './utils';

/** `null`, `undefined` and `NaN` have no place in the order: they go last. */
export function isMissing(value: unknown): boolean {
	return value == null || value !== value;
}

/**
 * `<` and `>` both ways: two values that neither precedes are a tie, so equal values that are not the same object (two `Date`s)
 * keep the order of the source, and the next key decides. `===` would tell them apart in both directions.
 */
export function compareValues(a: any, b: any): number {
	return a < b ? -1 : a > b ? 1 : 0;
}

const subtract = (a: number, b: number): number => a - b;

/**
 * The order of `sort` (ADR 0029) as a total order of the indices of `values`: the keys are read once, the missing values and
 * keys go last in the order of the source, `descending` inverts only the comparison of the present ones, and the ties are
 * broken by the index, so that two different indices are never equal.
 */
export function orderOf<T>(values: T[], comparer: Comparer<T> | undefined, descending: boolean): (i: number, j: number) => number {
	if (isFunction(comparer))
		return byFunction(values, comparer);
	const sign = descending ? -1 : 1;
	if (comparer === undefined)
		return byColumn(values, sign);
	if (isPropertyKey(comparer))
		return byColumn(keysOf(values, comparer), sign);
	const names = comparer as PropertyKey[];
	return names.length === 1 ? byColumn(keysOf(values, names[0]), sign) : byColumns(names.map(name => keysOf(values, name)), sign);
}

/**
 * The function decides alone; only the `undefined` elements go last, without calling it, as in `Array.prototype.sort`. An index
 * is equal to itself without calling it either, so that a function that is not `0` on equal values cannot move a pivot.
 */
function byFunction<T>(values: T[], compare: (a: T, b: T) => number): (i: number, j: number) => number {
	return (i, j) => {
		if (i === j)
			return 0;
		const a = values[i];
		const b = values[j];
		if (a === undefined || b === undefined)
			return a === b ? i - j : a === undefined ? 1 : -1;
		return compare(a, b) || i - j;
	};
}

/** One key per index; by subtraction when every present key is a number (`Infinity - Infinity` is `NaN`, a tie). */
function byColumn(keys: unknown[], sign: number): (i: number, j: number) => number {
	let numbers = true;
	for (const key of keys) {
		if (!isMissing(key) && typeof key !== 'number') {
			numbers = false;
			break;
		}
	}
	const compare: (a: any, b: any) => number = numbers ? subtract : compareValues;
	return (i, j) => {
		const a = keys[i];
		const b = keys[j];
		const aMissing = isMissing(a);
		const bMissing = isMissing(b);
		if (aMissing || bMissing)
			return aMissing && bMissing ? i - j : aMissing ? 1 : -1;
		return sign * compare(a, b) || i - j;
	};
}

/** Key by key: a missing key goes after a present one at its level, and the next key breaks a tie. */
function byColumns(columns: unknown[][], sign: number): (i: number, j: number) => number {
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
		return i - j;
	};
}

/** The key of each value; a `null` or `undefined` value has none. */
export function keysOf<T>(values: T[], key: PropertyKey): unknown[] {
	const keys: unknown[] = new Array(values.length);
	for (let i = 0; i < values.length; i++) {
		const value = values[i];
		keys[i] = value == null ? undefined : (value as any)[key];
	}
	return keys;
}
