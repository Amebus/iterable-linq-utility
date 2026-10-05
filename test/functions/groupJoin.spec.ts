import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectTransformation } from '../_helpers/operationKind';

import { groupJoin, take } from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

const identity = <T>(value: T): T => value;
const pair = <T, I>(outer: T, inners: I[]): [T, I[]] => [outer, inners];

describe('groupJoin', () => {
	test('rejects a missing or invalid iterable', () => {
		withoutInputIterableThrowsException((iterable: any) => groupJoin(iterable, [], identity, identity, pair), 'groupJoin');
	});

	test.each([null, undefined, 42, {}])('rejects an invalid inner %j', inner => {
		expect(() => groupJoin([1], inner as never, identity, identity, pair)).toThrow(/^\[iterable-linq-utility\/groupJoin\] The (provided )?"sourceIterable"/);
	});

	test.each(['outerKey', 'innerKey', 'result'])('rejects an invalid %s immediately', name => {
		const source = spyIterable([1, 2]);
		const inner = spyIterable([1]);
		const callbacks: Record<string, unknown> = { outerKey: identity, innerKey: identity, result: pair };
		for (const invalid of [undefined, null, 0, 'key', {}]) {
			callbacks[name] = invalid;
			expect(() => groupJoin(source, inner, callbacks.outerKey as never, callbacks.innerKey as never, callbacks.result as never))
				.toThrow(new Error(`[iterable-linq-utility/groupJoin] The "${name}" function must be provided`));
		}
		expect(source.stats).toEqual({ iterations: 0, reads: 0 });
		expect(inner.stats).toEqual({ iterations: 0, reads: 0 });
	});

	test.each([
		{ values: [], inner: [1], expected: [] },
		{ values: [1, 2], inner: [], expected: [[1, []], [2, []]] },
		{ values: [1, 2, 3], inner: [3, 1, 3], expected: [[1, [1]], [2, []], [3, [3, 3]]] },
		{ values: [1, 1], inner: [1], expected: [[1, [1]], [1, [1]]] }
	])('groupJoin($values, $inner) -> $expected', ({ values, inner, expected }) => {
		expect(Array.from(groupJoin(values, inner, identity, identity, pair))).toEqual(expected);
	});

	test('joins on the selected keys, with the inner values in the order of inner', () => {
		const teams = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }];
		const players = [{ team: 2, name: 'x' }, { team: 1, name: 'y' }, { team: 2, name: 'z' }];
		const result = groupJoin(teams, players, team => team.id, player => player.team, (team, members) => [team.name, members.map(player => player.name)]);
		expect(Array.from(result)).toEqual([['a', ['y']], ['b', ['x', 'z']]]);
	});

	test('compares the keys with SameValueZero, null and undefined included', () => {
		const result = Array.from(groupJoin([NaN, -0, null, undefined, 1], [0, NaN, null, undefined], identity, identity, pair));
		expect(result).toEqual([[NaN, [NaN]], [-0, [0]], [null, [null]], [undefined, [undefined]], [1, []]]);
	});

	test('calls the key selectors with the index in their own source', () => {
		const calls: string[] = [];
		Array.from(groupJoin(['a', 'b'], ['x', 'y', 'z'], (value, index) => calls.push(`outer ${value} ${index}`), (value, index) => calls.push(`inner ${value} ${index}`), pair));
		expect(calls).toEqual(['inner x 0', 'inner y 1', 'inner z 2', 'outer a 0', 'outer b 1']);
	});

	test('gives a new array to every call of result', () => {
		const result = Array.from(groupJoin([1, 1, 2, 2], [1], identity, identity, (outer, inners) => {
			inners.push(outer * 10);
			return inners;
		}));
		expect(result).toEqual([[1, 10], [1, 10], [20], [20]]);
		expect(result[2]).not.toBe(result[3]);
	});

	test('is a lazy, re-runnable Transformation that reads inner again on each run', () => {
		expectTransformation(source => groupJoin(source, [2, 3], identity, identity, pair));
		expectTransformation(source => groupJoin([1, 2], source, identity, identity, pair));
	});

	test('reads the whole inner on the first value, then the source lazily', () => {
		const source = spyIterable([2, 9]);
		const inner = spyIterable([2, 3, 2]);
		const iterator = groupJoin(source, inner, identity, identity, pair)[Symbol.iterator]();
		expect(inner.stats.reads).toBe(0);
		expect(iterator.next()).toEqual({ done: false, value: [2, [2, 2]] });
		expect(inner.stats).toEqual({ iterations: 1, reads: 3 });
		expect(source.stats.reads).toBe(1);
		iterator.next();
		expect(inner.stats.iterations).toBe(1);
	});

	test('works on an infinite source with take', () => {
		const source = infiniteSource(10);
		expect(Array.from(take(groupJoin(source.iterable, [1, 1], identity, identity, (_, inners) => inners.length), 3))).toEqual([0, 2, 0]);
		expect(source.stats.closed).toBe(true);
	});

	test('closes the source on an early consumer exit', () => {
		const source = closableSource([1, 2, 3]);
		expect(Array.from(take(groupJoin(source.iterable, [], identity, identity, pair), 1))).toEqual([[1, []]]);
		expect(source.state.closed).toBe(true);
	});

	test('closes both sources and becomes done when the innerKey throws', () => {
		const error = new Error('innerKey');
		const source = throwingSource(100, new Error('unused'));
		const inner = closableSource([1, 2]);
		const iterator = groupJoin(source.iterable, inner.iterable, identity, () => { throw error; }, pair)[Symbol.iterator]();
		expect(() => iterator.next()).toThrow(error);
		expect(source.returnSpy).toHaveBeenCalledOnce();
		expect(inner.state.closed).toBe(true);
		expect(iterator.next().done).toBe(true);
		iterator.return!();
		expect(source.returnSpy).toHaveBeenCalledOnce();
	});

	test('closes the source and propagates the error when inner throws', () => {
		const error = new Error('inner');
		const source = throwingSource(100, new Error('unused'));
		const iterator = groupJoin(source.iterable, throwingSource(2, error).iterable, identity, identity, pair)[Symbol.iterator]();
		expect(() => iterator.next()).toThrow(error);
		expect(source.returnSpy).toHaveBeenCalledOnce();
		expect(iterator.next().done).toBe(true);
	});

	test.each([
		{ name: 'outerKey', outerKey: (value: number) => { if (value === 2) throw new Error('outerKey'); return value; }, result: pair },
		{ name: 'result', outerKey: identity, result: (value: number) => { if (value === 2) throw new Error('result'); return value; } }
	])('closes the source and becomes done when $name throws', ({ name, outerKey, result }) => {
		const source = throwingSource(100, new Error('unused'));
		const iterator = groupJoin(source.iterable, [1], outerKey, identity, result as never)[Symbol.iterator]();
		expect(iterator.next().done).toBe(false);
		expect(() => iterator.next()).toThrow(name);
		expect(source.returnSpy).toHaveBeenCalledOnce();
		expect(iterator.next().done).toBe(true);
	});

	test('propagates source errors without closing', () => {
		const error = new Error('source');
		const source = throwingSource(1, error);
		const iterator = groupJoin(source.iterable, [], identity, identity, pair)[Symbol.iterator]();
		expect(() => iterator.next()).toThrow(error);
		expect(source.returnSpy).not.toHaveBeenCalled();
		iterator.return!();
	});

	test('forwards return values once and remains done', () => {
		const source = throwingSource(100, new Error('unused'));
		const iterator = groupJoin(source.iterable, [], identity, identity, pair)[Symbol.iterator]();
		expect(iterator.return!('end')).toEqual({ done: true, value: 'end' });
		iterator.return!();
		expect(iterator.next().done).toBe(true);
		expect(source.returnSpy).toHaveBeenCalledExactlyOnceWith('end');
	});

	test('infers the types of the callbacks and of the result', () => {
		const result = groupJoin([1], ['a'], (value, index) => {
			expectTypeOf(value).toEqualTypeOf<number>();
			expectTypeOf(index).toEqualTypeOf<number>();
			return String(value);
		}, value => {
			expectTypeOf(value).toEqualTypeOf<string>();
			return value;
		}, (outer, inners) => {
			expectTypeOf(outer).toEqualTypeOf<number>();
			expectTypeOf(inners).toEqualTypeOf<string[]>();
			return inners.length > 0;
		});
		expectTypeOf(result).toEqualTypeOf<Iterable<boolean>>();
	});
});
