import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers, records, scenarios, sum } = Helpers;

const ascending = (a: number, b: number): number => a - b;

// `numbers` is already sorted, the best case of the native sort: `sort/random` sorts a copy shuffled once, with a fixed seed.
let seed = 42;
const random = (): number => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const shuffled = [...numbers];
for (let i = shuffled.length - 1; i > 0; i--) {
	const j = Math.floor(random() * (i + 1));
	[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
}

scenarios('sort', {
	native: values => sum(values.toSorted(ascending)),
	chain: chain => sum(chain.sort()),
	Functions: values => sum(Functions.sort(values))
});

test('sort: random order', async ({ bench }) => {
	await cases(bench, 'sort/random')
		.add('native', () => sum(shuffled.toSorted(ascending)))
		.add('chain', () => sum(from(shuffled).sort()))
		.add('Functions', () => sum(Functions.sort(shuffled)))
		.run();
});

const byScore = (a: Helpers.IRecord, b: Helpers.IRecord): number => a.score - b.score;

// The same order as the list of keys ['group', 'score']: by group, then by score.
const byGroupAndScore = (a: Helpers.IRecord, b: Helpers.IRecord): number => (a.group < b.group ? -1 : a.group > b.group ? 1 : a.score - b.score);

test('sort: key', async ({ bench }) => {
	await cases(bench, 'sort/key')
		.add('native', () => records.toSorted(byScore).length)
		.add('chain', () => from(records).sort('score').collectToArray().length)
		.add('Functions', () => Functions.collectToArray(Functions.sort(records, 'score')).length)
		.run();
});

test('sort: list of keys', async ({ bench }) => {
	await cases(bench, 'sort/keys')
		.add('native', () => records.toSorted(byGroupAndScore).length)
		.add('chain', () => from(records).sort(['group', 'score']).collectToArray().length)
		.add('Functions', () => Functions.collectToArray(Functions.sort(records, ['group', 'score'])).length)
		.run();
});

test('sort: compare function', async ({ bench }) => {
	await cases(bench, 'sort/function')
		.add('native', () => records.toSorted(byScore).length)
		.add('chain', () => from(records).sort(byScore).collectToArray().length)
		.add('Functions', () => Functions.collectToArray(Functions.sort(records, byScore)).length)
		.run();
});
