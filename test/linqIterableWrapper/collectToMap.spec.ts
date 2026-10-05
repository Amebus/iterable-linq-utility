import { describe, expect, expectTypeOf, test } from 'vitest';
import { expectAction } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

const people = [
	{ id: 1, name: 'Ada' },
	{ id: 2, name: 'Bob' },
	{ id: 1, name: 'Cy' }
];

describe('IterableLinq.collectToMap', () => {

	test.each([undefined, null, {}])('IterableLinq.fromRange(5).collectToMap(%s) -> throw exception', keySelector => {
		const chain = IterableLinq.fromRange(5) as any;
		expect(() => chain.collectToMap(keySelector)).toThrow(Error);
	});

	test('IterableLinq.fromRange(5).collectToMap(v => v, {}) -> throw exception', () => {
		const chain = IterableLinq.fromRange(5) as any;
		expect(() => chain.collectToMap((v: number) => v, {})).toThrow(Error);
	});

	test('IterableLinq.collectToMap keeps the last value of each key', () => {
		expect([...IterableLinq.from(people).collectToMap(p => p.id)]).toEqual([[1, people[2]], [2, people[1]]]);
		expect([...IterableLinq.from(people).collectToMap(p => p.id, p => p.name)]).toEqual([[1, 'Cy'], [2, 'Bob']]);
	});

	test('IterableLinq.collectToMap composes with the other operations', () => {
		const map = IterableLinq
			.fromRange(6)
			.filter(v => v % 2 === 0)
			.collectToMap(v => `k${v}`, (v, index) => v * 10 + index);
		expect([...map]).toEqual([['k0', 0], ['k2', 21], ['k4', 42]]);
	});

	test('IterableLinq.collectToMap is action', () => {
		expectAction(source => IterableLinq.from(source).collectToMap(v => v));
		expectAction(source => IterableLinq.from(source).collectToMap(v => v, v => v * 2));
	});

	test('the return type follows the selectors', () => {
		expectTypeOf(IterableLinq.from(people).collectToMap(p => p.id)).toEqualTypeOf<Map<number, { id: number; name: string }>>();
		expectTypeOf(IterableLinq.from(people).collectToMap(p => p.id, p => p.name)).toEqualTypeOf<Map<number, string>>();
	});

});
