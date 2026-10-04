import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { group, middle, N, scenarios, sum } = Helpers;

function takeLast(count: number): Helpers.IVariants {
	return {
		// not `slice(-count)`: `slice(-0)` is every value
		native: values => sum(values.slice(Math.max(values.length - count, 0))),
		chain: chain => sum(chain.takeLast(count)),
		Functions: values => sum(Functions.takeLast(values, count))
	};
}

// direct: takes every value, so the buffer holds the whole source
scenarios('takeLast', takeLast(N));
group('takeLast', 'start', takeLast(1));
group('takeLast', 'middle', takeLast(middle));
