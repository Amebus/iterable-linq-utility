import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { fromRange } = IterableLinq;
const { cases } = Helpers;

// All the pairs i < j below 500 (about 125k), filtered, then searched with some.
const size = 500;

function nativeArray(target: number): boolean {
	const pairs: [number, number][] = [];
	for (let i = 0; i < size; i++) {
		for (let j = i + 1; j < size; j++) {
			pairs.push([i, j]);
		}
	}
	return pairs
		.filter(([i, j]) => (i + j) % 7 === 0)
		.some(([i, j]) => i * j === target);
}

function nativeLoop(target: number): boolean {
	for (let i = 0; i < size; i++) {
		for (let j = i + 1; j < size; j++) {
			if ((i + j) % 7 === 0 && i * j === target) {
				return true;
			}
		}
	}
	return false;
}

function chain(target: number): boolean {
	return fromRange(size)
		.flatMap(i => fromRange(i + 1, size).map(j => [i, j] as const))
		.filter(([i, j]) => (i + j) % 7 === 0)
		.some(([i, j]) => i * j === target);
}

test('pairs: early match', async ({ bench }) => {
	await cases(bench, 'chains/pairs-early')
		.add('native array', () => nativeArray(0))
		.add('native loop', () => nativeLoop(0))
		.add('chain', () => chain(0))
		.run();
});

test('pairs: no match', async ({ bench }) => {
	await cases(bench, 'chains/pairs-none')
		.add('native array', () => nativeArray(-1))
		.add('native loop', () => nativeLoop(-1))
		.add('chain', () => chain(-1))
		.run();
});
