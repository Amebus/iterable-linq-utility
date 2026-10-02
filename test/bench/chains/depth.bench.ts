import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';
import type { IIterableLinq } from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from } = IterableLinq;
const { cases, numbers, sum } = Helpers;

function maps(depth: number): IIterableLinq<number> {
	let chain = from(numbers);
	for (let i = 0; i < depth; i++) {
		chain = chain.map(v => v + 1);
	}
	return chain;
}

function nativeMaps(depth: number): number[] {
	let values = numbers;
	for (let i = 0; i < depth; i++) {
		values = values.map(v => v + 1);
	}
	return values;
}

test('depth: map stages', async ({ bench }) => {
	await cases(bench, 'chains/depth')
		.add('native, 10 maps', () => sum(nativeMaps(10)))
		.add('chain, 1 map', () => sum(maps(1)))
		.add('chain, 5 maps', () => sum(maps(5)))
		.add('chain, 10 maps', () => sum(maps(10)))
		.add('chain, 20 maps', () => sum(maps(20)))
		.run();
});
