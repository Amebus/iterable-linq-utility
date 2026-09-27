import { fromRange, Functions } from 'iterable-linq-utility';
import { test } from 'vitest';

import { measure, sum, values } from './helpers';

// Local copies: imported bindings go through a module runner getter on every read.
const n = values.length;

const { filter, map, range } = Functions;

function* evensDoubled(end: number): Generator<number> {
	for (let i = 0; i < end; i++) {
		if (i % 2 === 0) {
			yield i * 2;
		}
	}
}

test('map(filter(range))', async ({ bench }) => {
	await bench.compare(
		...measure(bench, 'map-filter-range', 'native array', () => sum(values.filter(v => v % 2 === 0).map(v => v * 2))),
		...measure(bench, 'map-filter-range', 'generator', () => sum(evensDoubled(n))),
		...measure(bench, 'map-filter-range', 'chain', () => sum(fromRange(n).filter(v => v % 2 === 0).map(v => v * 2))),
		...measure(bench, 'map-filter-range', 'Functions', () => sum(map(filter(range(n), v => v % 2 === 0), v => v * 2)))
	);
});

test('10 maps', async ({ bench }) => {
	await bench.compare(
		...measure(bench, 'map-depth', '1 map', () => sum(fromRange(n).map(v => v + 1))),
		...measure(bench, 'map-depth', '10 maps', () => {
			let chain = fromRange(n);
			for (let i = 0; i < 10; i++) {
				chain = chain.map(v => v + 1);
			}
			return sum(chain);
		})
	);
});
