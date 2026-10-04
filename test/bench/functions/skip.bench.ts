import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { group, middle, N, scenarios, sum } = Helpers;

function skip(count: number): Helpers.IVariants {
	return {
		native: values => sum(values.slice(count)),
		chain: chain => sum(chain.skip(count)),
		Functions: values => sum(Functions.skip(values, count))
	};
}

// skips `middle` values: half of `numbers`, all of `small`
scenarios('skip', skip(middle));
group('skip', 'zero', skip(0));
group('skip', 'beyond', skip(N * 2));
