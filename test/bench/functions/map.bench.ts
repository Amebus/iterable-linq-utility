import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { cases, double, group, records, scenarios, sum } = Helpers;

scenarios('map', {
	native: values => sum(values.map(double)),
	chain: chain => sum(chain.map(double)),
	Functions: values => sum(Functions.map(values, double))
});

function sumV(iterable: Iterable<{ v: number }>): number {
	let s = 0;
	for (const o of iterable) {
		s += o.v;
	}
	return s;
}

group('map', 'object', {
	native: values => sumV(values.map(v => ({ v }))),
	chain: chain => sumV(chain.map(v => ({ v }))),
	Functions: values => sumV(Functions.map(values, v => ({ v })))
});

group('map', 'index', {
	native: values => sum(values.map((v, i) => v + i)),
	chain: chain => sum(chain.map((v, i) => v + i)),
	Functions: values => sum(Functions.map(values, (v, i) => v + i))
});

// reads every value, so the lazy variants map them all
function length(iterable: Iterable<string>): number {
	let total = 0;
	for (const value of iterable)
		total += value.length;
	return total;
}

// a property key against the equivalent mapper (ADR 0025)
test('map: property', async ({ bench }) => {
	await cases(bench, 'map/property')
		.add('native', () => length(records.map(record => record.group)))
		.add('lambda', () => length(Functions.map(records, record => record.group)))
		.add('key', () => length(Functions.map(records, 'group')))
		.run();
});
