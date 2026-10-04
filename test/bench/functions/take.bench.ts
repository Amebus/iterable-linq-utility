import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { group, middle, N, scenarios, sum } = Helpers;

function take(count: number): Helpers.IVariants {
	return {
		native: values => sum(values.slice(0, count)),
		chain: chain => sum(chain.take(count)),
		Functions: values => sum(Functions.take(values, count))
	};
}

// direct: takes every value, so the whole source is read
scenarios('take', take(N));
group('take', 'start', take(1));
group('take', 'middle', take(middle));
