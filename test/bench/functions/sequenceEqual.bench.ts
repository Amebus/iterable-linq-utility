import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers } = Helpers;

function sequenceEqualLoop(a: number[], b: number[], equals: (x: number, y: number) => boolean = (x, y) => x === y): boolean {
	if (a.length !== b.length)
		return false;
	for (let i = 0; i < a.length; i++) {
		if (!equals(a[i], b[i]))
			return false;
	}
	return true;
}

const copy = numbers.slice();

test('sequenceEqual: equal sources', async ({ bench }) => {
	await cases(bench, 'sequenceEqual/equal')
		.add('native', () => sequenceEqualLoop(numbers, copy))
		.add('chain', () => from(numbers).sequenceEqual(copy))
		.add('Functions', () => Functions.sequenceEqual(numbers, copy))
		.run();
});

test('sequenceEqual: with equals', async ({ bench }) => {
	await cases(bench, 'sequenceEqual/equals')
		.add('native', () => sequenceEqualLoop(numbers, copy, (x, y) => x === y))
		.add('chain', () => from(numbers).sequenceEqual(copy, (x, y) => x === y))
		.add('Functions', () => Functions.sequenceEqual(numbers, copy, (x, y) => x === y))
		.run();
});
