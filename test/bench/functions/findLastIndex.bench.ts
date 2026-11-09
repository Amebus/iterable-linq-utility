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

// on an array findLastIndex reads from the end and stops early, like the native method (ADR 0036); after a map or a filter it reads the whole source
scenarios('findLastIndex', findLastIndex(missing));
group('findLastIndex', 'end', findLastIndex(N - 1));
group('findLastIndex', 'middle', findLastIndex(middle));
