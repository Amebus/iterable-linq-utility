import * as IterableLinq from 'iterable-linq-utility';
import { test } from 'vitest';

import * as Helpers from '../helpers';
import type { IRecord } from '../helpers';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers, records } = Helpers;

function native(values: number[]): number | undefined {
	let best = values[0];
	for (const v of values) {
		if (v < best) {
			best = v;
		}
	}
	return best;
}

function nativeByScore(values: IRecord[]): IRecord | undefined {
	let best = values[0];
	for (const r of values) {
		if (r.score < best.score) {
			best = r;
		}
	}
	return best;
}

// The same order as the list of keys ['group', 'score']: by group, then by score.
function nativeByGroupAndScore(values: IRecord[]): IRecord | undefined {
	let best = values[0];
	for (const r of values) {
		if (r.group < best.group || (r.group === best.group && r.score < best.score)) {
			best = r;
		}
	}
	return best;
}

test('min: numbers, no comparer', async ({ bench }) => {
	await cases(bench, 'min/numbers')
		.add('native loop', () => native(numbers))
		.add('chain', () => from(numbers).min())
		.add('Functions', () => Functions.min(numbers))
		.run();
});

test('min: compare function', async ({ bench }) => {
	await cases(bench, 'min/function')
		.add('native loop', () => nativeByScore(records))
		.add('chain', () => from(records).min((a, b) => a.score - b.score))
		.add('Functions', () => Functions.min(records, (a, b) => a.score - b.score))
		.run();
});

test('min: key', async ({ bench }) => {
	await cases(bench, 'min/key')
		.add('native loop', () => nativeByScore(records))
		.add('chain', () => from(records).min('score'))
		.add('Functions', () => Functions.min(records, 'score'))
		.run();
});

test('min: list of keys', async ({ bench }) => {
	await cases(bench, 'min/keys')
		.add('native loop', () => nativeByGroupAndScore(records))
		.add('chain', () => from(records).min(['group', 'score']))
		.add('Functions', () => Functions.min(records, ['group', 'score']))
		.run();
});
