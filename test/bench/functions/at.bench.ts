import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { first, group, middle, N, scenarios } = Helpers;

function at(index: number): Helpers.IVariants {
	return {
		native: values => values.at(index),
		chain: chain => chain.at(index),
		Functions: values => Functions.at(values, index)
	};
}

// direct: an index out of range, so the whole source is read
scenarios('at', at(N));
group('at', 'start', at(first));
group('at', 'middle', at(middle));
// a negative index keeps the last `middle` values in a buffer
group('at', 'negative', at(-middle));
