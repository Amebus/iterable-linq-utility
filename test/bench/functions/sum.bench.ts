import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { double, group, scenarios, sum } = Helpers;

scenarios('sum', {
	native: values => values.reduce((total, v) => total + v, 0),
	loop: values => sum(values),
	chain: chain => chain.sum(),
	Functions: values => Functions.sum(values)
});

group('sum', 'selector', {
	native: values => values.reduce((total, v) => total + double(v), 0),
	loop: values => sum(values.values().map(double)),
	chain: chain => chain.sum(double),
	Functions: values => Functions.sum(values, double)
});
