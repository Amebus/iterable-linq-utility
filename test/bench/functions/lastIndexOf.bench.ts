import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { group, middle, missing, N, scenarios } = Helpers;

function lastIndexOf(value: number): Helpers.IVariants {
	return {
		native: values => values.lastIndexOf(value),
		chain: chain => chain.lastIndexOf(value),
		Functions: values => Functions.lastIndexOf(values, value)
	};
}

// on an array lastIndexOf reads from the end and stops early, like the native method (ADR 0036); after a map or a filter it reads the whole source
scenarios('lastIndexOf', lastIndexOf(missing));
group('lastIndexOf', 'end', lastIndexOf(N - 1));
group('lastIndexOf', 'middle', lastIndexOf(middle));
