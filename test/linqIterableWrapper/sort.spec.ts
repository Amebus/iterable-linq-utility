import { describe, expect, test } from 'vitest';
import { expectTransformation } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

const people = [
	{ firstName: 'Bob', lastName: 'Rossi', age: 30 },
	{ firstName: 'Ann', lastName: 'Bianchi', age: 25 },
	{ firstName: 'Ann', lastName: 'Rossi', age: 40 }
];

describe('IterableLinq.sort', () => {

	test('IterableLinq.fromRange(5).reverse().sort() -> [0, 1, 2, 3, 4]', () => {
		expect(IterableLinq.fromRange(5).reverse().sort().collectToArray()).toEqual([0, 1, 2, 3, 4]);
	});

	test('IterableLinq.sort({ descending: true })', () => {
		expect(IterableLinq.from([1, 3, 2]).sort({ descending: true }).collectToArray()).toEqual([3, 2, 1]);
	});

	test('IterableLinq.sort(key, { descending: true })', () => {
		expect(IterableLinq.from(people).sort('age', { descending: true }).map('age').collectToArray()).toEqual([40, 30, 25]);
	});

	test('IterableLinq.sort(list of keys)', () => {
		expect(IterableLinq.from(people).sort(['lastName', 'firstName']).map('firstName').collectToArray()).toEqual(['Ann', 'Ann', 'Bob']);
	});

	test('IterableLinq.sort(compare function)', () => {
		expect(IterableLinq.from(people).sort((a, b) => a.firstName.localeCompare(b.firstName)).map('lastName').collectToArray())
			.toEqual(['Bianchi', 'Rossi', 'Rossi']);
	});

	test('IterableLinq.sort(undefined, options) and an optional comparer', () => {
		expect(IterableLinq.from([1, 3, 2]).sort(undefined, { descending: true }).collectToArray()).toEqual([3, 2, 1]);
		const comparer: ((a: number, b: number) => number) | undefined = undefined as ((a: number, b: number) => number) | undefined;
		expect(IterableLinq.from([1, 3, 2]).sort(comparer).collectToArray()).toEqual([1, 2, 3]);
	});

	test('IterableLinq.sort composes with the other operations', () => {
		const r = IterableLinq
			.fromRange(10)
			.filter(v => v % 2 === 0)
			.sort({ descending: true })
			.take(2)
			.collectToArray();
		expect(r).toEqual([8, 6]);
	});

	test('IterableLinq.sort is transformation', () => {
		expectTransformation(source => IterableLinq.from(source).sort());
	});

	test('IterableLinq.sort accepts only the keys of the values', () => {
		// @ts-expect-error 'b' is not a key of { a: number }
		expect(() => IterableLinq.from([{ a: 1 }]).sort('b')).not.toThrow();
	});

});
