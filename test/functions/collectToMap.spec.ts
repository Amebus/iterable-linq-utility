import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectAction } from '../_helpers/operationKind';

import {
	collectToMap,
	range
} from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

const people = [
	{ id: 1, name: 'Ada' },
	{ id: 2, name: 'Bob' },
	{ id: 1, name: 'Cy' }
];

describe('collectToMap', () => {

	test('collectToMap without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(collectToMap);
	});

	test.each([undefined, null, {}, false])('collectToMap(range(5), %s) -> throw exception', keySelector => {
		const collectToMapJs = collectToMap as any;
		expect(() => collectToMapJs(range(5), keySelector)).toThrow(new Error('[iterable-linq-utility/collectToMap] The "keySelector" must be a function or a property key'));
		expect(() => collectToMapJs([], keySelector)).toThrow(new Error('[iterable-linq-utility/collectToMap] The "keySelector" must be a function or a property key'));
	});

	test.each([null, {}, false])('collectToMap(range(5), v => v, %s) -> throw exception', valueSelector => {
		const collectToMapJs = collectToMap as any;
		expect(() => collectToMapJs(range(5), (v: number) => v, valueSelector)).toThrow(new Error('[iterable-linq-utility/collectToMap] The "valueSelector" must be a function or a property key'));
	});

	test('collectToMap maps each key to the value', () => {
		const map = collectToMap(['a', 'bb', 'ccc'], v => v.length);
		expect(map).toBeInstanceOf(Map);
		expect([...map]).toEqual([[1, 'a'], [2, 'bb'], [3, 'ccc']]);
	});

	test('collectToMap of an empty source is an empty Map', () => {
		expect(collectToMap([] as number[], v => v).size).toBe(0);
		expect(collectToMap([] as number[], v => v, v => v).size).toBe(0);
	});

	test('a later value with the same key replaces the earlier one, in the position of the key', () => {
		expect([...collectToMap(people, p => p.id)]).toEqual([[1, people[2]], [2, people[1]]]);
		expect([...collectToMap(people, p => p.id, p => p.name)]).toEqual([[1, 'Cy'], [2, 'Bob']]);
	});

	test('valueSelector selects the value stored', () => {
		expect([...collectToMap(people.slice(0, 2), p => p.name, p => p.id)]).toEqual([['Ada', 1], ['Bob', 2]]);
	});

	test('an undefined valueSelector stores the value itself', () => {
		expect([...collectToMap([1, 2], v => v * 10, undefined)]).toEqual([[10, 1], [20, 2]]);
	});

	test('the selectors receive the value and its index', () => {
		const keyCalls: [string, number][] = [];
		const valueCalls: [string, number][] = [];
		collectToMap(['a', 'b'], (v, index) => {
			keyCalls.push([v, index]);
			return v;
		}, (v, index) => {
			valueCalls.push([v, index]);
			return index;
		});
		expect(keyCalls).toEqual([['a', 0], ['b', 1]]);
		expect(valueCalls).toEqual([['a', 0], ['b', 1]]);
		const indexes: number[] = [];
		collectToMap(['a', 'b'], (v, index) => {
			indexes.push(index);
			return v;
		});
		expect(indexes).toEqual([0, 1]);
	});

	test('the keys are compared with SameValueZero', () => {
		expect([...collectToMap([NaN, NaN, 0, -0], v => v, (_v, index) => index)]).toEqual([[NaN, 1], [0, 3]]);
	});

	test('collectToMap is action', () => {
		expectAction(source => collectToMap(source, v => v));
		expectAction(source => collectToMap(source, v => v, v => v * 2));
	});

	test.each([
		{ name: 'keySelector', collect: (source: Iterable<number>, error: Error) => collectToMap(source, () => { throw error; }) },
		{ name: 'keySelector with a valueSelector', collect: (source: Iterable<number>, error: Error) => collectToMap(source, () => { throw error; }, v => v) },
		{ name: 'valueSelector', collect: (source: Iterable<number>, error: Error) => collectToMap(source, v => v, () => { throw error; }) }
	])('a throwing $name closes the source and propagates the error', ({ collect }) => {
		const error = new Error('boom');
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(() => collect(iterable, error)).toThrow(error);
		expect(state.closed).toBe(true);
	});

	test('an error of the source propagates, without closing the source', () => {
		const error = new Error('source');
		const { returnSpy, iterable } = throwingSource(3, error);
		expect(() => collectToMap(iterable, v => v)).toThrow(error);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	test('the return type follows the selectors', () => {
		expectTypeOf(collectToMap(people, p => p.id)).toEqualTypeOf<Map<number, { id: number; name: string }>>();
		expectTypeOf(collectToMap(people, p => p.id, p => p.name)).toEqualTypeOf<Map<number, string>>();
	});

	describe('with property keys', () => {
		const people = [{ id: 1, name: 'Ann' }, { id: 2, name: 'Bob' }, { id: 1, name: 'Cy' }];

		test('a key gives the same map as the equivalent keySelector', () => {
			expect([...collectToMap(people, 'id')]).toEqual([...collectToMap(people, p => p.id)]);
		});

		test('every combination of functions and keys gives the same map', () => {
			const byLambdas = [...collectToMap(people, p => p.id, p => p.name)];
			expect([...collectToMap(people, 'id', 'name')]).toEqual(byLambdas);
			expect([...collectToMap(people, 'id', p => p.name)]).toEqual(byLambdas);
			expect([...collectToMap(people, p => p.id, 'name')]).toEqual(byLambdas);
		});

		test('a key with an undefined valueSelector stores the values themselves', () => {
			expect([...collectToMap(people, 'id', undefined)]).toEqual([...collectToMap(people, 'id')]);
		});

		test('the mixed forms pass the index to the function', () => {
			expect([...collectToMap(people, 'name', (_, index) => index)]).toEqual([['Ann', 0], ['Bob', 1], ['Cy', 2]]);
			expect([...collectToMap(people, (_, index) => index, 'name')]).toEqual([[0, 'Ann'], [1, 'Bob'], [2, 'Cy']]);
		});

		test.each([
			{ name: 'key', run: (it: Iterable<{ id: number; name: string }>) => collectToMap(it, 'id') },
			{ name: 'key and value', run: (it: Iterable<{ id: number; name: string }>) => collectToMap(it, 'id', 'name') },
			{ name: 'key and valueSelector', run: (it: Iterable<{ id: number; name: string }>) => collectToMap(it, 'id', p => p.name) },
			{ name: 'keySelector and value', run: (it: Iterable<{ id: number; name: string }>) => collectToMap(it, p => p?.id, 'name') }
		])('a null value with $name throws a TypeError and closes the source', ({ run }) => {
			const { state, iterable } = closableSource<{ id: number; name: string } | null>([{ id: 1, name: 'Ann' }, null]);
			expect(() => run(iterable as Iterable<{ id: number; name: string }>)).toThrow(TypeError);
			expect(state.closed).toBe(true);
		});

		test('gives the types of the properties', () => {
			expectTypeOf(collectToMap(people, 'id')).toEqualTypeOf<Map<number, { id: number; name: string }>>();
			expectTypeOf(collectToMap(people, 'id', 'name')).toEqualTypeOf<Map<number, string>>();
			expectTypeOf(collectToMap(people, p => p.name, 'id')).toEqualTypeOf<Map<string, number>>();
			expectTypeOf(collectToMap(people, 'name', p => p.id * 2)).toEqualTypeOf<Map<string, number>>();
			// @ts-expect-error not a key of the values
			collectToMap(people, 'missing');
		});
	});

	test('an undefined valueSelector stores the values themselves, also in the type', () => {
		const people = [{ id: 1, name: 'Ann' }];
		expectTypeOf(collectToMap(people, 'id', undefined)).toEqualTypeOf<Map<number, { id: number; name: string }>>();
		expectTypeOf(collectToMap(people, p => p.id, undefined)).toEqualTypeOf<Map<number, { id: number; name: string }>>();
	});
});
