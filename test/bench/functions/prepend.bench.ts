import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { scenarios, sum } = Helpers;

scenarios('prepend', {
	native: values => sum([1, ...values]),
	chain: chain => sum(chain.prepend(1)),
	Functions: values => sum(Functions.prepend(values, 1))
});
