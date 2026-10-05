import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions, fromObject } = IterableLinq;
const { cases, N, small } = Helpers;

function objectOf(size: number): Record<string, number> {
	const object: Record<string, number> = {};
	for (let i = 0; i < size; i++)
		object[`k${i}`] = i;
	return object;
}

const big = objectOf(N);
const little = objectOf(small.length);
// half the keys on the object, half on its prototype
const derived = Object.assign(Object.create(objectOf(N / 2)), objectOf(N / 2)) as Record<string, number>;

/** Reads every value, so that nothing is optimised away. */
function count(iterable: Iterable<unknown>): number {
	let total = 0;
	for (const value of iterable)
		total += value === undefined ? 0 : 1;
	return total;
}

// `fromObject` creates a source: no map and filter groups.
test('fromObject: direct', async ({ bench }) => {
	await cases(bench, 'fromObject/direct')
		.add('native', () => count(Object.entries(big)))
		.add('chain', () => count(fromObject(big)))
		.add('Functions', () => count(Functions.fromObject(big)))
		.run();
});

test('fromObject: small', async ({ bench }) => {
	await cases(bench, 'fromObject/small')
		.add('native', () => count(Object.entries(little)))
		.add('chain', () => count(fromObject(little)))
		.add('Functions', () => count(Functions.fromObject(little)))
		.run();
});

test('fromObject: keys', async ({ bench }) => {
	await cases(bench, 'fromObject/keys')
		.add('native', () => count(Object.keys(big)))
		.add('chain', () => count(fromObject(big, { yield: 'keys' })))
		.add('Functions', () => count(Functions.fromObject(big, { yield: 'keys' })))
		.run();
});

test('fromObject: values', async ({ bench }) => {
	await cases(bench, 'fromObject/values')
		.add('native', () => count(Object.values(big)))
		.add('chain', () => count(fromObject(big, { yield: 'values' })))
		.add('Functions', () => count(Functions.fromObject(big, { yield: 'values' })))
		.run();
});

test('fromObject: inherited', async ({ bench }) => {
	await cases(bench, 'fromObject/inherited')
		.add('native', () => {
			let total = 0;
			for (const key in derived)
				total += derived[key] === undefined ? 0 : 1;
			return total;
		})
		.add('chain', () => count(fromObject(derived, { inherited: true })))
		.add('Functions', () => count(Functions.fromObject(derived, { inherited: true })))
		.run();
});

test('fromObject: descriptors', async ({ bench }) => {
	await cases(bench, 'fromObject/descriptors')
		.add('native', () => count(Reflect.ownKeys(big).map(key => Reflect.getOwnPropertyDescriptor(big, key))))
		.add('chain', () => count(fromObject(big, { yield: 'descriptors' })))
		.add('Functions', () => count(Functions.fromObject(big, { yield: 'descriptors' })))
		.run();
});
