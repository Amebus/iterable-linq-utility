import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { group, N, scenarios, sum } = Helpers;

const quarter = N / 4;

function slice(start: number, end?: number): Helpers.IVariants {
	return {
		native: values => sum(values.slice(start, end)),
		chain: chain => sum(chain.slice(start, end)),
		Functions: values => sum(Functions.slice(values, start, end))
	};
}

scenarios('slice', slice(quarter, N - quarter));
// a negative end keeps `quarter` values in a buffer
group('slice', 'negative-end', slice(quarter, -quarter));
// a negative start reads the whole source and keeps the last `quarter` values
group('slice', 'negative-start', slice(-quarter));
