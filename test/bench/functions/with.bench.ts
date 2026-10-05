import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { group, scenarios, sum } = Helpers;

// an index inside every source of the scenarios, `small` and after a filter included
const index = 500;

function withValue(at: number): Helpers.IVariants {
	return {
		native: values => sum(values.with(at, -1)),
		chain: chain => sum(chain.with(at, -1)),
		Functions: values => sum(Functions.with(values, at, -1))
	};
}

scenarios('with', withValue(index));
group('with', 'start', withValue(0));
// a negative index delays the values through a buffer of one value
group('with', 'negative', withValue(-1));
