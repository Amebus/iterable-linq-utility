import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions, unit } = IterableLinq;
const { scenarios, sum } = Helpers;

const u = unit();

// The native case is the same source without tapChain.
scenarios('tapChain', {
	native: values => sum(values),
	chain: chain => sum(chain.tapChain(() => u)),
	Functions: values => sum(Functions.tapChain(values, () => u))
});
