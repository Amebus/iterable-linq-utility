import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { first, group, middle, missing, scenarios } = Helpers;

function findIndex(value: number): Helpers.IVariants {
	return {
		native: values => values.findIndex(v => v === value),
		chain: chain => chain.findIndex(v => v === value),
		Functions: values => Functions.findIndex(values, v => v === value)
	};
}

scenarios('findIndex', findIndex(missing));
group('findIndex', 'start', findIndex(first));
group('findIndex', 'middle', findIndex(middle));
