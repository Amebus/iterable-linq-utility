import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers } = Helpers;

const middle = numbers.length / 2;

for (const { variant, index } of [
	{ variant: 'middle', index: middle },
	{ variant: 'last', index: -1 },
	{ variant: 'negative-middle', index: -middle },
	{ variant: 'out-of-range', index: numbers.length }
]) {
	test(`at: ${variant}`, async ({ bench }) => {
		await cases(bench, `at/${variant}`)
			.add('native', () => numbers.at(index))
			.add('chain', () => from(numbers).at(index))
			.add('Functions', () => Functions.at(numbers, index))
			.run();
	});
}

test('at: after a map', async ({ bench }) => {
	await cases(bench, 'at/map')
		.add('native', () => numbers.values().map(v => v * 2).drop(middle).next().value)
		.add('chain', () => from(numbers).map(v => v * 2).at(middle))
		.add('Functions', () => Functions.at(Functions.map(numbers, v => v * 2), middle))
		.run();
});
