import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { first, group, middle, missing, scenarios } = Helpers;

// rejects `value`: the early exit happens where it is
function every(value: number): Helpers.IVariants {
	return {
		native: values => values.every(v => v !== value),
		chain: chain => chain.every(v => v !== value),
		Functions: values => Functions.every(values, v => v !== value)
	};
}

scenarios('every', every(missing));
group('every', 'start', every(first));
group('every', 'middle', every(middle));
