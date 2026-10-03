import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers } = Helpers;

test('join: default separator', async ({ bench }) => {
	await cases(bench, 'join/default')
		.add('native', () => numbers.join())
		.add('chain', () => from(numbers).join())
		.add('Functions', () => Functions.join(numbers))
		.run();
});

test('join: after a filter', async ({ bench }) => {
	await cases(bench, 'join/filter')
		.add('native', () => numbers.filter(v => v % 2 === 0).join(' '))
		.add('chain', () => from(numbers).filter(v => v % 2 === 0).join(' '))
		.add('Functions', () => Functions.join(Functions.filter(numbers, v => v % 2 === 0), ' '))
		.run();
});
