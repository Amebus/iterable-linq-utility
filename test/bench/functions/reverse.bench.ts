import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { scenarios, sum } = Helpers;

scenarios('reverse', {
	native: values => sum(values.toReversed()),
	chain: chain => sum(chain.reverse()),
	Functions: values => sum(Functions.reverse(values))
});
