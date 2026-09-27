import * as IterableLinq from 'iterable-linq-utility';
import { test } from 'vitest';

import * as Helpers from '../helpers';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from } = IterableLinq;
const { cases, numbers } = Helpers;

// A long chain stopped early by some: the chain reads a few values, native arrays compute every stage in full.
test('early-exit: some after 4 stages', async ({ bench }) => {
	await cases(bench, 'chains/early-exit')
		.add('native array', () => numbers
			.map(v => v * 3)
			.filter(v => v % 2 === 0)
			.map(v => v + 1)
			.filter(v => v % 5 !== 0)
			.some(v => v > 100))
		.add('native loop', () => {
			for (const v of numbers) {
				const w = v * 3;
				if (w % 2 === 0 && (w + 1) % 5 !== 0 && w + 1 > 100) {
					return true;
				}
			}
			return false;
		})
		.add('chain', () => from(numbers)
			.map(v => v * 3)
			.filter(v => v % 2 === 0)
			.map(v => v + 1)
			.filter(v => v % 5 !== 0)
			.some(v => v > 100))
		.run();
});
