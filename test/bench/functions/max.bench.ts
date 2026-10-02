import { test } from 'vitest';
import * as Helpers from '../helpers';
import type { IRecord } from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers, records } = Helpers;

function native(values: number[]): number | undefined {
	let best = values[0];
	for (const v of values) {
		if (v > best) {
			best = v;
		}
	}
	return best;
}

function nativeByScore(values: IRecord[]): IRecord | undefined {
	let best = values[0];
	for (const r of values) {
		if (r.score > best.score) {
			best = r;
		}
	}
	return best;
}

// The same order as the list of keys ['group', 'score']: by group, then by score.
function nativeByGroupAndScore(values: IRecord[]): IRecord | undefined {
	let best = values[0];
	for (const r of values) {
		if (r.group > best.group || (r.group === best.group && r.score > best.score)) {
			best = r;
		}
	}
	return best;
}

test('max: numbers, no comparer', async ({ bench }) => {
	await cases(bench, 'max/numbers')
		.add('native loop', () => native(numbers))
		.add('chain', () => from(numbers).max())
		.add('Functions', () => Functions.max(numbers))
		.run();
});

test('max: compare function', async ({ bench }) => {
	await cases(bench, 'max/function')
		.add('native loop', () => nativeByScore(records))
		.add('chain', () => from(records).max((a, b) => a.score - b.score))
		.add('Functions', () => Functions.max(records, (a, b) => a.score - b.score))
		.run();
});

test('max: key', async ({ bench }) => {
	await cases(bench, 'max/key')
		.add('native loop', () => nativeByScore(records))
		.add('chain', () => from(records).max('score'))
		.add('Functions', () => Functions.max(records, 'score'))
		.run();
});

test('max: list of keys', async ({ bench }) => {
	await cases(bench, 'max/keys')
		.add('native loop', () => nativeByGroupAndScore(records))
		.add('chain', () => from(records).max(['group', 'score']))
		.add('Functions', () => Functions.max(records, ['group', 'score']))
		.run();
});
