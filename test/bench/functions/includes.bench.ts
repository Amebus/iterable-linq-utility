import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { first, group, middle, missing, scenarios } = Helpers;

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
