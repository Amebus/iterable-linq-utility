import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, records, scenarios } = Helpers;

function loop(values: number[]): number | undefined {
	let best = values[0];
	for (const v of values) {
		if (v < best) {
			best = v;
		}
	}
	return best;
}

scenarios('min', {
	native: values => values.reduce((best, v) => (v < best ? v : best)),
	loop,
	chain: chain => chain.min(),
	Functions: values => Functions.min(values)
});

function byScore(best: Helpers.IRecord, r: Helpers.IRecord): Helpers.IRecord {
	return r.score < best.score ? r : best;
}

// The same order as the list of keys ['group', 'score']: by group, then by score.
function byGroupAndScore(best: Helpers.IRecord, r: Helpers.IRecord): Helpers.IRecord {
	return r.group < best.group || (r.group === best.group && r.score < best.score) ? r : best;
}

function loopBy(values: Helpers.IRecord[], pick: (best: Helpers.IRecord, r: Helpers.IRecord) => Helpers.IRecord): Helpers.IRecord | undefined {
	let best = values[0];
	for (const r of values) {
		best = pick(best, r);
	}
	return best;
}

test('min: compare function', async ({ bench }) => {
	await cases(bench, 'min/function')
		.add('native', () => records.reduce(byScore))
		.add('loop', () => loopBy(records, byScore))
		.add('chain', () => from(records).min((a, b) => a.score - b.score))
		.add('Functions', () => Functions.min(records, (a, b) => a.score - b.score))
		.run();
});

test('min: key', async ({ bench }) => {
	await cases(bench, 'min/key')
		.add('native', () => records.reduce(byScore))
		.add('loop', () => loopBy(records, byScore))
		.add('chain', () => from(records).min('score'))
		.add('Functions', () => Functions.min(records, 'score'))
		.run();
});

test('min: list of keys', async ({ bench }) => {
	await cases(bench, 'min/keys')
		.add('native', () => records.reduce(byGroupAndScore))
		.add('loop', () => loopBy(records, byGroupAndScore))
		.add('chain', () => from(records).min(['group', 'score']))
		.add('Functions', () => Functions.min(records, ['group', 'score']))
		.run();
});
