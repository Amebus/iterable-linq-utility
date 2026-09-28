import * as IterableLinq from 'iterable-linq-utility';
import { test } from 'vitest';

import * as Helpers from '../helpers';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { fromRange, Functions } = IterableLinq;
const { cases, numbers, sum } = Helpers;

const { filter, map, range } = Functions;
const n = numbers.length;

function* evensDoubled(end: number): Generator<number> {
	for (let i = 0; i < end; i++) {
		if (i % 2 === 0) {
			yield i * 2;
		}
	}
}

test('map(filter(range))', async ({ bench }) => {
	await cases(bench, 'chains/map-filter-range')
		.add('native array', () => sum(numbers.filter(v => v % 2 === 0).map(v => v * 2)))
		.add('generator', () => sum(evensDoubled(n)))
		.add('chain', () => sum(fromRange(n).filter(v => v % 2 === 0).map(v => v * 2)))
		.add('Functions', () => sum(map(filter(range(n), v => v % 2 === 0), v => v * 2)))
		.run();
});
