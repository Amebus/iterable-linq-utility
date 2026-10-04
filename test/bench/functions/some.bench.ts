import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { first, group, middle, missing, scenarios } = Helpers;

function some(value: number): Helpers.IVariants {
	return {
		native: values => values.some(v => v === value),
		chain: chain => chain.some(v => v === value),
		Functions: values => Functions.some(values, v => v === value)
	};
}

// Without a predicate, some reads one value: `direct` uses the predicate, which matches no value.
scenarios('some', some(missing));
group('some', 'start', some(first));
group('some', 'middle', some(middle));

group('some', 'without-predicate', {
	native: values => values.length > 0,
	chain: chain => chain.some(),
	Functions: values => Functions.some(values)
});
