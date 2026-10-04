import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, group, isEven, numbers, scenarios, sum } = Helpers;

scenarios('filter', {
	native: values => sum(values.filter(isEven)),
	chain: chain => sum(chain.filter(isEven)),
	Functions: values => sum(Functions.filter(values, isEven))
});

group('filter', 'all', {
	native: values => sum(values.filter(v => v >= 0)),
	chain: chain => sum(chain.filter(v => v >= 0)),
	Functions: values => sum(Functions.filter(values, v => v >= 0))
});

group('filter', 'none', {
	native: values => sum(values.filter(v => v < 0)),
	chain: chain => sum(chain.filter(v => v < 0)),
	Functions: values => sum(Functions.filter(values, v => v < 0))
});

const mixed: (number | string)[] = numbers.map(v => v % 2 === 0 ? v : String(v));
const isNumber = (value: number | string): value is number => typeof value === 'number';

test('filter: type guard', async ({ bench }) => {
	await cases(bench, 'filter/type-guard')
		.add('native', () => sum(mixed.filter(isNumber)))
		.add('chain', () => sum(from(mixed).filter(isNumber)))
		.add('Functions', () => sum(Functions.filter(mixed, isNumber)))
		.run();
});
