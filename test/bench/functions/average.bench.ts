import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { cases, double, group, records, scenarios } = Helpers;

function averageLoop(values: number[], selector: (value: number) => number = v => v): number | undefined {
	let total = 0;
	let count = 0;
	for (const v of values) {
		total += selector(v);
		count++;
	}
	return count === 0 ? undefined : total / count;
}

scenarios('average', {
	native: values => values.reduce((total, v) => total + v, 0) / values.length,
	loop: values => averageLoop(values),
	chain: chain => chain.average(),
	Functions: values => Functions.average(values)
});

group('average', 'selector', {
	native: values => values.reduce((total, v) => total + double(v), 0) / values.length,
	loop: values => averageLoop(values, double),
	chain: chain => chain.average(double),
	Functions: values => Functions.average(values, double)
});

// a property key against the equivalent selector (ADR 0025)
test('average: property', async ({ bench }) => {
	await cases(bench, 'average/property')
		.add('native', () => {
			let total = 0;
			for (const record of records)
				total += record.score;
			return total / records.length;
		})
		.add('lambda', () => Functions.average(records, record => record.score))
		.add('key', () => Functions.average(records, 'score'))
		.run();
});
