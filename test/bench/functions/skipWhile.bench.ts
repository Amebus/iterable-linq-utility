import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { group, middle, N, scenarios, sum } = Helpers;

function native(values: number[], predicate: (value: number) => boolean): number[] {
	const index = values.findIndex(v => !predicate(v));
	return index === -1 ? [] : values.slice(index);
}

function loop(values: number[], predicate: (value: number) => boolean): number[] {
	let i = 0;
	while (i < values.length && predicate(values[i]))
		i++;
	return values.slice(i);
}

function skipWhile(limit: number): Helpers.IVariants {
	const predicate = (v: number): boolean => v < limit;
	return {
		native: values => sum(native(values, predicate)),
		loop: values => sum(loop(values, predicate)),
		chain: chain => sum(chain.skipWhile(predicate)),
		Functions: values => sum(Functions.skipWhile(values, predicate))
	};
}

// skips the values below `middle`
scenarios('skipWhile', skipWhile(middle));
group('skipWhile', 'none', skipWhile(0));
group('skipWhile', 'all', skipWhile(N * 2));
