import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { group, scenarios } = Helpers;

function sumBackward(values: number[], seed: number, from: number): number {
	let total = seed;
	for (let i = from; i >= 0; i--)
		total += values[i];
	return total;
}

scenarios('reduceRight', {
	native: values => values.reduceRight((acc, v) => acc + v, 0),
	loop: values => sumBackward(values, 0, values.length - 1),
	chain: chain => chain.reduceRight(0, (acc, v) => acc + v),
	Functions: values => Functions.reduceRight(values, 0, (acc, v) => acc + v)
});

group('reduceRight', 'no-seed', {
	native: values => values.reduceRight((acc, v) => acc + v),
	loop: values => sumBackward(values, values[values.length - 1], values.length - 2),
	chain: chain => chain.reduceRight((acc, v) => acc + v),
	Functions: values => Functions.reduceRight(values, (acc, v) => acc + v)
});
