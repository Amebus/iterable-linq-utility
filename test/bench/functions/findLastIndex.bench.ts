import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { group, middle, missing, N, scenarios } = Helpers;

function findLastIndex(value: number): Helpers.IVariants {
	return {
		native: values => values.findLastIndex(v => v === value),
		chain: chain => chain.findLastIndex(v => v === value),
		Functions: values => Functions.findLastIndex(values, v => v === value)
	};
}

// findLastIndex reads the whole source; the native method reads the array from the end, so it stops early
scenarios('findLastIndex', findLastIndex(missing));
group('findLastIndex', 'end', findLastIndex(N - 1));
group('findLastIndex', 'middle', findLastIndex(middle));
