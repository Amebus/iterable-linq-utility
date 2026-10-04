import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, group, numbers, scenarios, sum } = Helpers;

scenarios('flatMap', {
	native: values => sum(values.flatMap(v => [v])),
	chain: chain => sum(chain.flatMap(v => [v])),
	Functions: values => sum(Functions.flatMap(values, v => [v]))
});

group('flatMap', 'empty', {
	native: values => sum(values.flatMap(() => [])),
	chain: chain => sum(chain.flatMap(() => [])),
	Functions: values => sum(Functions.flatMap(values, () => []))
});

function* twice(v: number): Generator<number> {
	yield v;
	yield v;
}

// Array.prototype.flatMap does not read generators: the native case is a nested loop
group('flatMap', 'generator', {
	native: values => {
		let s = 0;
		for (const v of values) {
			for (const w of twice(v)) {
				s += w;
			}
		}
		return s;
	},
	chain: chain => sum(chain.flatMap(twice)),
	Functions: values => sum(Functions.flatMap(values, twice))
});

// A tenth of the values, so the 10-value inner iterables still give 1e5 values.
const tenth = numbers.slice(0, numbers.length / 10);

test('flatMap: inner array of 10', async ({ bench }) => {
	await cases(bench, 'flatMap/ten')
		.add('native', () => sum(tenth.flatMap(v => [v, v, v, v, v, v, v, v, v, v])))
		.add('chain', () => sum(from(tenth).flatMap(v => [v, v, v, v, v, v, v, v, v, v])))
		.add('Functions', () => sum(Functions.flatMap(tenth, v => [v, v, v, v, v, v, v, v, v, v])))
		.run();
});
