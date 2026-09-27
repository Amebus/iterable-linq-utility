import { from, fromRange, unit } from 'iterable-linq-utility';
import { test } from 'vitest';

import { measure, sum, values } from './helpers';

// Local copy: imported bindings go through a module runner getter on every read.
const u = unit();

test('map', async ({ bench }) => {
	await bench.compare(
		...measure(bench, 'map', 'native map', () => sum(values.map(v => v * 2))),
		...measure(bench, 'map', 'map', () => sum(from(values).map(v => v * 2)))
	);
});

test('filter', async ({ bench }) => {
	await bench.compare(
		...measure(bench, 'filter', 'native filter', () => sum(values.filter(v => v % 2 === 0))),
		...measure(bench, 'filter', 'filter', () => sum(from(values).filter(v => v % 2 === 0)))
	);
});

test('flatMap', async ({ bench }) => {
	await bench.compare(
		...measure(bench, 'flatMap', 'native flatMap', () => sum(values.flatMap(v => [v, v]))),
		...measure(bench, 'flatMap', 'flatMap', () => sum(from(values).flatMap(v => [v, v])))
	);
});

test('tap', async ({ bench }) => {
	await bench.compare(
		...measure(bench, 'tap', 'from(array)', () => sum(from(values))),
		...measure(bench, 'tap', 'tap', () => sum(from(values).tap(() => u)))
	);
});

test('memoize', async ({ bench }) => {
	const cached = fromRange(values.length).memoize();
	sum(cached);
	await bench.compare(
		...measure(bench, 'memoize', 'from(array)', () => sum(from(values))),
		...measure(bench, 'memoize', 'memoize, first run', () => sum(fromRange(values.length).memoize())),
		...measure(bench, 'memoize', 'memoize, cached run', () => sum(cached))
	);
});
