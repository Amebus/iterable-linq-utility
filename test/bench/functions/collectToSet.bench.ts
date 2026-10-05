import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { scenarios } = Helpers;

scenarios('collectToSet', {
	native: values => new Set(values),
	chain: chain => chain.collectToSet(),
	Functions: values => Functions.collectToSet(values)
});
