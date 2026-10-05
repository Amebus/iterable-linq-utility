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

	test.each([undefined, null, {}, 'id'])('collectToMap(range(5), %s) -> throw exception', keySelector => {
		const collectToMapJs = collectToMap as any;
		expect(() => collectToMapJs(range(5), keySelector)).toThrow(new Error('[iterable-linq-utility/collectToMap] The "keySelector" function must be provided'));
		expect(() => collectToMapJs([], keySelector)).toThrow(new Error('[iterable-linq-utility/collectToMap] The "keySelector" function must be provided'));
	});

	test.each([null, {}, 'name'])('collectToMap(range(5), v => v, %s) -> throw exception', valueSelector => {
		const collectToMapJs = collectToMap as any;
		expect(() => collectToMapJs(range(5), (v: number) => v, valueSelector)).toThrow(new Error('[iterable-linq-utility/collectToMap] The "valueSelector" function must be provided'));
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

});
