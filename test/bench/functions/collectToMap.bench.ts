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
		// a property key against the equivalent keySelector (ADR 0025)
		.add('key', () => Functions.collectToMap(records, 'id'))
		.run();
});

// the total of the scores by group: merge against a loop that reads the Map
function totalsByGroup(values: Helpers.IRecord[]): Map<string, number> {
	const map = new Map<string, number>();
	for (const r of values) {
		const total = map.get(r.group);
		map.set(r.group, total === undefined ? r.score : total + r.score);
	}
	return map;
}

const add = (total: number, score: number): number => total + score;

test('collectToMap: merge', async ({ bench }) => {
	await cases(bench, 'collectToMap/merge')
		.add('native', () => totalsByGroup(records))
		.add('chain', () => from(records).collectToMap(r => r.group, r => r.score, { merge: add }))
		.add('Functions', () => Functions.collectToMap(records, r => r.group, r => r.score, { merge: add }))
		.add('keys', () => Functions.collectToMap(records, 'group', 'score', { merge: add }))
		.run();
});
