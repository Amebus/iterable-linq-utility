import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, scenarios, sum } = Helpers;

function withDefault(values: number[], value: number): number[] {
	return values.length === 0 ? [value] : values;
}

scenarios('defaultIfEmpty', {
	native: values => sum(withDefault(values, -1)),
	chain: chain => sum(chain.defaultIfEmpty(-1)),
	Functions: values => sum(Functions.defaultIfEmpty(values, -1))
});

const none: number[] = [];

test('defaultIfEmpty: empty source', async ({ bench }) => {
	await cases(bench, 'defaultIfEmpty/empty')
		.add('native', () => sum(withDefault(none, -1)))
		.add('chain', () => sum(from(none).defaultIfEmpty(-1)))
		.add('Functions', () => sum(Functions.defaultIfEmpty(none, -1)))
		.run();
});
