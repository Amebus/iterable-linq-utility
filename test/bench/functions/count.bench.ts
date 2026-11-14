import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, group, isEven, numbers, scenarios } = Helpers;

function countLoop(values: number[], predicate: (value: number) => boolean = () => true): number {
	let r = 0;
	for (const v of values) {
		if (predicate(v))
			r++;
	}
	return r;
}

scenarios('count', {
	native: values => values.length,
	loop: values => countLoop(values),
	chain: chain => chain.count(),
	Functions: values => Functions.count(values)
});

group('count', 'predicate', {
	native: values => values.filter(isEven).length,
	loop: values => countLoop(values, isEven),
	chain: chain => chain.count(isEven),
	Functions: values => Functions.count(values, isEven)
});

// without a predicate, count reads the size of a Set or a Map (ADR 0037)
const set = new Set(numbers);
const map = new Map(numbers.map(value => [value, value]));

test('count: a Set', async ({ bench }) => {
	await cases(bench, 'count/set-source')
		.add('native', () => set.size)
		.add('chain', () => from(set).count())
		.add('Functions', () => Functions.count(set))
		.run();
});

test('count: a Map', async ({ bench }) => {
	await cases(bench, 'count/map-source')
		.add('native', () => map.size)
		.add('chain', () => from(map).count())
		.add('Functions', () => Functions.count(map))
		.run();
});
