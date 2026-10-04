import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { scenarios } = Helpers;

scenarios('join', {
	native: values => values.join(),
	chain: chain => chain.join(),
	Functions: values => Functions.join(values)
});
