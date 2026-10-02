import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from } = IterableLinq;
const { cases, records } = Helpers;

// filter → map → max by key
test('top-by-key: best doubled score outside g0', async ({ bench }) => {
	await cases(bench, 'chains/top-by-key')
		.add('native array', () => records
			.filter(r => r.group !== 'g0')
			.map(r => ({ id: r.id, score: r.score * 2 }))
			.reduce<{ id: number; score: number } | undefined>((best, r) => best === undefined || r.score > best.score ? r : best, undefined))
		.add('native loop', () => {
			let best: { id: number; score: number } | undefined;
			for (const r of records) {
				if (r.group !== 'g0') {
					const item = { id: r.id, score: r.score * 2 };
					if (best === undefined || item.score > best.score) {
						best = item;
					}
				}
			}
			return best;
		})
		.add('chain', () => from(records)
			.filter(r => r.group !== 'g0')
			.map(r => ({ id: r.id, score: r.score * 2 }))
			.max('score'))
		.run();
});
