import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { group, middle, N, scenarios, sum } = Helpers;

function skipLast(count: number): Helpers.IVariants {
	return {
		native: values => sum(values.slice(0, Math.max(values.length - count, 0))),
		chain: chain => sum(chain.skipLast(count)),
		Functions: values => sum(Functions.skipLast(values, count))
	};
}

// direct: skips every value, so the buffer holds the whole source
scenarios('skipLast', skipLast(N));
group('skipLast', 'start', skipLast(1));
group('skipLast', 'middle', skipLast(middle));
