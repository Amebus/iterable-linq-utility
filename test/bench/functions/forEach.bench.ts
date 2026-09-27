import * as IterableLinq from 'iterable-linq-utility';
import { test } from 'vitest';

import * as Helpers from '../helpers';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions, unit } = IterableLinq;
const { cases, numbers, small } = Helpers;

const u = unit();

test('forEach', async ({ bench }) => {
	let s = 0;
	await cases(bench, 'forEach/sum')
		.add('native for…of', () => {
			for (const v of numbers) {
				s += v;
			}
		})
		.add('native Array.forEach', () => numbers.forEach(v => {
			s += v;
		}))
		.add('chain', () => from(numbers).forEach(v => {
			s += v;
			return u;
		}))
		.add('Functions', () => Functions.forEach(numbers, v => {
			s += v;
			return u;
		}))
		.run();
	return s;
});

test('forEachAsync', async ({ bench }) => {
	let s = 0;
	await cases(bench, 'forEachAsync/sum')
		.add('native for…of + await', async () => {
			for (const v of small) {
				await Promise.resolve();
				s += v;
			}
		})
		.add('chain', () => from(small).forEachAsync(async v => {
			await Promise.resolve();
			s += v;
			return u;
		}))
		.add('Functions', () => Functions.forEachAsync(small, async v => {
			await Promise.resolve();
			s += v;
			return u;
		}))
		.run();
	return s;
});
