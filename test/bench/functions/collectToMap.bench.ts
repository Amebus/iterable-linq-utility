import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, double, group, records, scenarios } = Helpers;

function toMap<K, V>(values: number[], key: (v: number) => K, value: (v: number) => V): Map<K, V> {
	const map = new Map<K, V>();
	for (const v of values)
		map.set(key(v), value(v));
	return map;
}

const identity = (v: number): number => v;

scenarios('collectToMap', {
	native: values => new Map(values.map(v => [v, v])),
	loop: values => toMap(values, identity, identity),
	chain: chain => chain.collectToMap(identity),
	Functions: values => Functions.collectToMap(values, identity)
});

group('collectToMap', 'value-selector', {
	native: values => new Map(values.map(v => [v, double(v)])),
	loop: values => toMap(values, identity, double),
	chain: chain => chain.collectToMap(identity, double),
	Functions: values => Functions.collectToMap(values, identity, double)
});

test('collectToMap: records by id', async ({ bench }) => {
	await cases(bench, 'collectToMap/records')
		.add('native', () => new Map(records.map(r => [r.id, r])))
		.add('chain', () => from(records).collectToMap(r => r.id))
		.add('Functions', () => Functions.collectToMap(records, r => r.id))
		.run();
});
