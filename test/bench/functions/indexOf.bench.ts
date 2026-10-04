import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { first, group, middle, missing, scenarios } = Helpers;

function indexOf(value: number): Helpers.IVariants {
	return {
		native: values => values.indexOf(value),
		chain: chain => chain.indexOf(value),
		Functions: values => Functions.indexOf(values, value)
	};
}

scenarios('indexOf', indexOf(missing));
group('indexOf', 'start', indexOf(first));
group('indexOf', 'middle', indexOf(middle));
