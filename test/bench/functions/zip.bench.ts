import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { group, numbers, scenarios } = Helpers;

// the sum of the values of the tuples, so every tuple is read
function sumTuples(tuples: Iterable<number[]>): number {
	let total = 0;
	for (const tuple of tuples) {
		for (const value of tuple)
			total += value;
	}
	return total;
}

const other = numbers;
const third = numbers;

scenarios('zip', {
	native: values => sumTuples(values.map((v, i) => [v, other[i]])),
	chain: chain => sumTuples(chain.zip(other)),
	Functions: values => sumTuples(Functions.zip(values, other))
});

group('zip', 'three', {
	native: values => sumTuples(values.map((v, i) => [v, other[i], third[i]])),
	chain: chain => sumTuples(chain.zip(other, third)),
	Functions: values => sumTuples(Functions.zip(values, other, third))
});
