import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { double, group, isEven, numbers, scenarios, small } = Helpers;

// A copy of the values of each scenario: the sources are equal, so the whole of them is read.
const copies: Record<Helpers.Scenario, number[]> = {
	direct: numbers.slice(),
	small: small.slice(),
	map: numbers.map(double),
	filter: numbers.filter(isEven)
};

function loop(a: number[], b: number[], equals: (x: number, y: number) => boolean = (x, y) => x === y): boolean {
	if (a.length !== b.length)
		return false;
	for (let i = 0; i < a.length; i++) {
		if (!equals(a[i], b[i]))
			return false;
	}
	return true;
}

scenarios('sequenceEqual', {
	native: (values, scenario) => values.length === copies[scenario].length && values.every((v, i) => v === copies[scenario][i]),
	loop: (values, scenario) => loop(values, copies[scenario]),
	chain: (chain, scenario) => chain.sequenceEqual(copies[scenario]),
	Functions: (values, scenario) => Functions.sequenceEqual(values, copies[scenario])
});

const equals = (x: number, y: number): boolean => x === y;

group('sequenceEqual', 'equals', {
	native: values => values.length === copies.direct.length && values.every((v, i) => equals(v, copies.direct[i])),
	loop: values => loop(values, copies.direct, equals),
	chain: chain => chain.sequenceEqual(copies.direct, equals),
	Functions: values => Functions.sequenceEqual(values, copies.direct, equals)
});
