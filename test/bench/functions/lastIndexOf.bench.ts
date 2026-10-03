import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers } = Helpers;

const middle = numbers.length / 2;
const last = numbers.length - 1;

for (const { variant, value } of [
	{ variant: 'end', value: last },
	{ variant: 'middle', value: middle },
	{ variant: 'none', value: -1 }
]) {
	test(`lastIndexOf: ${variant}`, async ({ bench }) => {
		await cases(bench, `lastIndexOf/${variant}`)
			.add('native', () => numbers.lastIndexOf(value))
			.add('chain', () => from(numbers).lastIndexOf(value))
			.add('Functions', () => Functions.lastIndexOf(numbers, value))
			.run();
	});
}
