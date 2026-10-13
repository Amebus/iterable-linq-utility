import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { cases, double, group, records, scenarios, sum } = Helpers;

scenarios('sum', {
	native: values => values.reduce((total, v) => total + v, 0),
	loop: values => sum(values),
	chain: chain => chain.sum(),
	Functions: values => Functions.sum(values)
});

group('sum', 'selector', {
	native: values => values.reduce((total, v) => total + double(v), 0),
	loop: values => sum(values.values().map(double)),
	chain: chain => chain.sum(double),
	Functions: values => Functions.sum(values, double)
});

// a property key against the equivalent selector (ADR 0025)
test('sum: property', async ({ bench }) => {
	await cases(bench, 'sum/property')
		.add('native', () => {
			let total = 0;
			for (const record of records)
				total += record.score;
			return total;
		})
		.add('lambda', () => Functions.sum(records, record => record.score))
		.add('key', () => Functions.sum(records, 'score'))
		.run();
});
