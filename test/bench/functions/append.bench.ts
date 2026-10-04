import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { scenarios, sum } = Helpers;

scenarios('append', {
	native: values => sum([...values, 1]),
	chain: chain => sum(chain.append(1)),
	Functions: values => sum(Functions.append(values, 1))
});
