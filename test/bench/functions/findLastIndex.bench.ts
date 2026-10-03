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
	test(`findLastIndex: ${variant}`, async ({ bench }) => {
		await cases(bench, `findLastIndex/${variant}`)
			.add('native', () => numbers.findLastIndex(v => v === value))
			.add('chain', () => from(numbers).findLastIndex(v => v === value))
			.add('Functions', () => Functions.findLastIndex(numbers, v => v === value))
			.run();
	});
}
