import { from, unit } from 'iterable-linq-utility';
import { test } from 'vitest';

import { measure, values } from './helpers';

// Local copy: imported bindings go through a module runner getter on every read.
const u = unit();

test('actions', async ({ bench }) => {
	await bench.compare(
		...measure(bench, 'actions', 'native reduce', () => values.reduce((acc, v) => acc + v, 0)),
		...measure(bench, 'actions', 'collectToArray', () => from(values).collectToArray()),
		...measure(bench, 'actions', 'reduce', () => from(values).reduce(0, (acc, v) => acc + v)),
		...measure(bench, 'actions', 'some, no match', () => from(values).some(v => v < 0)),
		...measure(bench, 'actions', 'min', () => from(values).min()),
		...measure(bench, 'actions', 'max', () => from(values).max()),
		...measure(bench, 'actions', 'forEach', () => from(values).forEach(() => u))
	);
});
