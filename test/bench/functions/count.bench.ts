import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { group, isEven, scenarios } = Helpers;

function countLoop(values: number[], predicate: (value: number) => boolean = () => true): number {
	let r = 0;
	for (const v of values) {
		if (predicate(v))
			r++;
	}
	return r;
}

scenarios('count', {
	native: values => values.length,
	loop: values => countLoop(values),
	chain: chain => chain.count(),
	Functions: values => Functions.count(values)
});

group('count', 'predicate', {
	native: values => values.filter(isEven).length,
	loop: values => countLoop(values, isEven),
	chain: chain => chain.count(isEven),
	Functions: values => Functions.count(values, isEven)
});
