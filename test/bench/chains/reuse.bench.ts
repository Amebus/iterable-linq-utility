import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';
import type { IIterableLinq } from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from } = IterableLinq;
const { cases, records } = Helpers;

function base(): IIterableLinq<number> {
	return from(records).filter(r => r.score > 250).map(r => r.score);
}

function threeActions(chain: IIterableLinq<number>): number {
	return (chain.min() ?? 0) + (chain.max() ?? 0) + chain.reduce(0, (acc, v) => acc + v);
}

// The same chain read by 3 actions: re-run each time, memoized, or materialized.
test('reuse: min, max and reduce on one chain', async ({ bench }) => {
	await cases(bench, 'chains/reuse')
		.add('native array', () => {
			const scores = records.filter(r => r.score > 250).map(r => r.score);
			let min = scores[0];
			let max = scores[0];
			for (const s of scores) {
				if (s < min) {
					min = s;
				}
				if (s > max) {
					max = s;
				}
			}
			return min + max + scores.reduce((acc, v) => acc + v, 0);
		})
		.add('chain, re-run', () => threeActions(base()))
		.add('chain, memoize', () => threeActions(base().memoize()))
		.add('chain, materialize', () => threeActions(base().materialize()))
		.run();
});
