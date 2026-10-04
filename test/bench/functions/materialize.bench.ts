import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, double, isEven, numbers, small, sum } = Helpers;

test('materialize: direct', async ({ bench }) => {
	await cases(bench, 'materialize/direct')
		.add('native', () => sum([...numbers]))
		.add('chain', () => sum(from(numbers).materialize()))
		.add('Functions', () => sum(Functions.materialize(numbers)))
		.run();
});

test('materialize: small', async ({ bench }) => {
	await cases(bench, 'materialize/small')
		.add('native', () => sum([...small]))
		.add('chain', () => sum(from(small).materialize()))
		.add('Functions', () => sum(Functions.materialize(small)))
		.run();
});

// The array methods already return an array: the native case has no copy.
test('materialize: after a map', async ({ bench }) => {
	await cases(bench, 'materialize/map')
		.add('native', () => sum(numbers.map(double)))
		.add('chain', () => sum(from(numbers).map(double).materialize()))
		.add('from(collectToArray)', () => sum(from(from(numbers).map(double).collectToArray())))
		.add('Functions', () => sum(Functions.materialize(Functions.map(numbers, double))))
		.run();
});

test('materialize: after a filter', async ({ bench }) => {
	await cases(bench, 'materialize/filter')
		.add('native', () => sum(numbers.filter(isEven)))
		.add('chain', () => sum(from(numbers).filter(isEven).materialize()))
		.add('Functions', () => sum(Functions.materialize(Functions.filter(numbers, isEven))))
		.run();
});
