import * as IterableLinq from 'iterable-linq-utility';
import { test } from 'vitest';
import * as Helpers from '../helpers';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers, sum, N } = Helpers;
const half = N / 2;

for (const { variant, count } of [
	{ variant: 'zero', count: 0 },
	{ variant: 'half', count: half },
	{ variant: 'beyond', count: N * 2 }
]) {
	test(`skip: ${variant}`, async ({ bench }) => {
		await cases(bench, `skip/${variant}`)
			.add('native', () => sum(numbers.slice(count)))
			.add('chain', () => sum(from(numbers).skip(count)))
			.add('Functions', () => sum(Functions.skip(numbers, count)))
			.run();
	});
}

test('skip: after a map', async ({ bench }) => {
	await cases(bench, 'skip/map')
		.add('native', () => sum(numbers.values().map(v => v * 2).drop(half)))
		.add('chain', () => sum(from(numbers).map(v => v * 2).skip(half)))
		.add('Functions', () => sum(Functions.skip(Functions.map(numbers, v => v * 2), half)))
		.run();
});
