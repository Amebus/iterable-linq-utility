import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, middle, scenarios } = Helpers;

function native(values: number[], predicate: (value: number) => boolean): number | undefined {
	const matches = values.filter(predicate);
	if (matches.length > 1)
		throw new Error('more than one value');
	return matches[0];
}

function loop(values: number[], predicate: (value: number) => boolean): number | undefined {
	let found: number | undefined;
	let count = 0;
	for (const v of values) {
		if (predicate(v)) {
			if (++count > 1)
				throw new Error('more than one value');
			found = v;
		}
	}
	return found;
}

const isMiddle = (v: number): boolean => v === middle;

// Without a predicate, single throws at the second value of a longer source: `direct` uses the predicate,
// which matches one value in the middle (none in `small`), so the whole source is read.
scenarios('single', {
	native: values => native(values, isMiddle),
	loop: values => loop(values, isMiddle),
	chain: chain => chain.single(isMiddle),
	Functions: values => Functions.single(values, isMiddle)
});

const one = [middle];

test('single: without predicate', async ({ bench }) => {
	await cases(bench, 'single/without-predicate')
		.add('native', () => native(one, () => true))
		.add('loop', () => loop(one, () => true))
		.add('chain', () => from(one).single())
		.add('Functions', () => Functions.single(one))
		.run();
});
