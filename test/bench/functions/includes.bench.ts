import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, first, group, middle, missing, numbers, scenarios } = Helpers;

function includes(value: number): Helpers.IVariants {
	return {
		native: values => values.includes(value),
		chain: chain => chain.includes(value),
		Functions: values => Functions.includes(values, value)
	};
}

scenarios('includes', includes(missing));
group('includes', 'start', includes(first));
group('includes', 'middle', includes(middle));
// NaN needs SameValueZero, not ===
group('includes', 'NaN', includes(NaN));

// on a Set includes calls Set.prototype.has (ADR 0036)
const set = new Set(numbers);

test('includes: Set', async ({ bench }) => {
	await cases(bench, 'includes/set')
		.add('native', () => set.has(middle))
		.add('chain', () => from(set).includes(middle))
		.add('Functions', () => Functions.includes(set, middle))
		.run();
});
