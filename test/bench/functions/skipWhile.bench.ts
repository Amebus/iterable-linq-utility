import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers, sum, N } = Helpers;

function skipWhileLoop(values: number[], predicate: (value: number) => boolean): number[] {
	let i = 0;
	while (i < values.length && predicate(values[i]))
		i++;
	return values.slice(i);
}

for (const { variant, limit } of [
	{ variant: 'none', limit: 0 },
	{ variant: 'half', limit: N / 2 },
	{ variant: 'all', limit: N * 2 }
]) {
	test(`skipWhile: ${variant}`, async ({ bench }) => {
		await cases(bench, `skipWhile/${variant}`)
			.add('native', () => sum(skipWhileLoop(numbers, v => v < limit)))
			.add('chain', () => sum(from(numbers).skipWhile(v => v < limit)))
			.add('Functions', () => sum(Functions.skipWhile(numbers, v => v < limit)))
			.run();
	});
}
