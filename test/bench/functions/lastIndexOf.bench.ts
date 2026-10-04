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

// lastIndexOf reads the whole source; the native method reads the array from the end, so it stops early
scenarios('lastIndexOf', lastIndexOf(missing));
group('lastIndexOf', 'end', lastIndexOf(N - 1));
group('lastIndexOf', 'middle', lastIndexOf(middle));
