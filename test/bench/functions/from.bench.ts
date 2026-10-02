import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from } = IterableLinq;
const { cases, numbers, sum } = Helpers;

const n = numbers.length;
const set = new Set(numbers);
const text = 'x'.repeat(n);

function* generate(end: number): Generator<number> {
	for (let i = 0; i < end; i++) {
		yield i;
	}
}

function length(iterable: Iterable<string>): number {
	let l = 0;
	for (const c of iterable) {
		l += c.length;
	}
	return l;
}

test('from: array', async ({ bench }) => {
	await cases(bench, 'from/array')
		.add('native for…of', () => sum(numbers))
		.add('chain', () => sum(from(numbers)))
		.run();
});

test('from: Set', async ({ bench }) => {
	await cases(bench, 'from/set')
		.add('native for…of', () => sum(set))
		.add('chain', () => sum(from(set)))
		.run();
});

test('from: string', async ({ bench }) => {
	await cases(bench, 'from/string')
		.add('native for…of', () => length(text))
		.add('chain', () => length(from(text)))
		.run();
});

test('from: generator', async ({ bench }) => {
	await cases(bench, 'from/generator')
		.add('native for…of', () => sum(generate(n)))
		.add('chain', () => sum(from(generate(n))))
		.run();
});

test('from: another chain', async ({ bench }) => {
	await cases(bench, 'from/chain')
		.add('from(array)', () => sum(from(numbers)))
		.add('from(from(array))', () => sum(from(from(numbers))))
		.run();
});
