import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { scenarios } = Helpers;

// the sum of the indexes and of the values, so every pair is read
function sumPairs(pairs: Iterable<[number, number]>): number {
	let total = 0;
	for (const [index, value] of pairs)
		total += index + value;
	return total;
}

scenarios('entries', {
	native: values => sumPairs(values.entries()),
	chain: chain => sumPairs(chain.entries()),
	Functions: values => sumPairs(Functions.entries(values))
});
