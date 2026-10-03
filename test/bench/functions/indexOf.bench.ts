import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers } = Helpers;

const middle = numbers.length / 2;

for (const { variant, value } of [
	{ variant: 'start', value: 0 },
	{ variant: 'middle', value: middle },
	{ variant: 'none', value: -1 }
]) {
	test(`indexOf: ${variant}`, async ({ bench }) => {
		await cases(bench, `indexOf/${variant}`)
			.add('native', () => numbers.indexOf(value))
			.add('chain', () => from(numbers).indexOf(value))
			.add('Functions', () => Functions.indexOf(numbers, value))
			.run();
	});
}
