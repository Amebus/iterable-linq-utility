import { describe, expect, expectTypeOf, test } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { infiniteSource } from '../_helpers/generators/infiniteSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectTransformation } from '../_helpers/operationKind';

import { innerJoin, take } from '@/functions';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

const identity = <T>(value: T): T => value;
const pair = <T, I>(outer: T, inner: I): [T, I] => [outer, inner];

describe('innerJoin', () => {
	test('rejects a missing or invalid iterable', () => {
		withoutInputIterableThrowsException((iterable: any) => innerJoin(iterable, [], identity, identity, pair), 'innerJoin');
	});

	test.each([null, undefined, 42, {}])('rejects an invalid inner %j', inner => {
		expect(() => innerJoin([1], inner as never, identity, identity, pair)).toThrow(/^\[iterable-linq-utility\/innerJoin\] The (provided )?"sourceIterable"/);
	});

	test.each(['outerKey', 'innerKey', 'result'])('rejects an invalid %s immediately', name => {
		const source = spyIterable([1, 2]);
		const inner = spyIterable([1]);
		const callbacks: Record<string, unknown> = { outerKey: identity, innerKey: identity, result: pair };
		for (const invalid of [undefined, null, 0, 'key', {}]) {
			callbacks[name] = invalid;
			expect(() => innerJoin(source, inner, callbacks.outerKey as never, callbacks.innerKey as never, callbacks.result as never))
				.toThrow(new Error(`[iterable-linq-utility/innerJoin] The "${name}" function must be provided`));
		}
		expect(source.stats).toEqual({ iterations: 0, reads: 0 });
		expect(inner.stats).toEqual({ iterations: 0, reads: 0 });
	});

	test.each([
		{ values: [], inner: [1], expected: [] },
		{ values: [1, 2], inner: [], expected: [] },
		{ values: [1, 2, 3], inner: [3, 1, 3], expected: [[1, 1], [3, 3], [3, 3]] },
		{ values: [1, 1], inner: [1], expected: [[1, 1], [1, 1]] },
		{ values: [1, 2], inner: [3, 4], expected: [] }
	])('innerJoin($values, $inner) -> $expected', ({ values, inner, expected }) => {
		expect(Array.from(innerJoin(values, inner, identity, identity, pair))).toEqual(expected);
	});

	test('yields the pairs in the order of the source, then of inner', () => {
		const teams = [{ id: 1, name: 'a' }, { id: 3, name: 'c' }, { id: 2, name: 'b' }];
		const players = [{ team: 2, name: 'x' }, { team: 1, name: 'y' }, { team: 2, name: 'z' }];
		const result = innerJoin(teams, players, team => team.id, player => player.team, (team, player) => `${team.name}-${player.name}`);
		expect(Array.from(result)).toEqual(['a-y', 'b-x', 'b-z']);
	});

	test('compares the keys with SameValueZero, null and undefined included', () => {
		const result = Array.from(innerJoin([NaN, -0, null, undefined, 1], [0, NaN, null, undefined], identity, identity, pair));
		expect(result).toEqual([[NaN, NaN], [-0, 0], [null, null], [undefined, undefined]]);
	});

	test('calls the key selectors with the index in their own source', () => {
		const calls: string[] = [];
		Array.from(innerJoin(['a', 'b'], ['x', 'y', 'z'], (value, index) => calls.push(`outer ${value} ${index}`), (value, index) => calls.push(`inner ${value} ${index}`), pair));
		expect(calls).toEqual(['inner x 0', 'inner y 1', 'inner z 2', 'outer a 0', 'outer b 1']);
	});

	test('is a lazy, re-runnable Transformation that reads inner again on each run', () => {
		expectTransformation(source => innerJoin(source, [2, 3], identity, identity, pair));
		expectTransformation(source => innerJoin([1, 2], source, identity, identity, pair));
	});

	test('reads the whole inner on the first value, then the source lazily', () => {
		const source = spyIterable([2, 9, 3]);
		const inner = spyIterable([2, 3, 2]);
		const iterator = innerJoin(source, inner, identity, identity, pair)[Symbol.iterator]();
		expect(inner.stats.reads).toBe(0);
		expect(iterator.next()).toEqual({ done: false, value: [2, 2] });
		expect(inner.stats).toEqual({ iterations: 1, reads: 3 });
		expect(source.stats.reads).toBe(1);
		expect(iterator.next()).toEqual({ done: false, value: [2, 2] });
		expect(source.stats.reads).toBe(1);
		expect(iterator.next()).toEqual({ done: false, value: [3, 3] });
		expect(source.stats.reads).toBe(3);
		expect(inner.stats.iterations).toBe(1);
	});

	test('works on an infinite source with take', () => {
		const source = infiniteSource(10);
		expect(Array.from(take(innerJoin(source.iterable, [3, 1, 3], identity, identity, pair), 3))).toEqual([[1, 1], [3, 3], [3, 3]]);
		expect(source.stats.closed).toBe(true);
	});

	test('closes the source on an early consumer exit between the matches of one value', () => {
		const source = closableSource([1, 2, 3]);
		expect(Array.from(take(innerJoin(source.iterable, [1, 1], identity, identity, pair), 1))).toEqual([[1, 1]]);
		expect(source.state.closed).toBe(true);
	});

	test('closes both sources and becomes done when the innerKey throws', () => {
		const error = new Error('innerKey');
		const source = throwingSource(100, new Error('unused'));
		const inner = closableSource([1, 2]);
		const iterator = innerJoin(source.iterable, inner.iterable, identity, () => { throw error; }, pair)[Symbol.iterator]();
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
		const iterator = innerJoin(source.iterable, throwingSource(2, error).iterable, identity, identity, pair)[Symbol.iterator]();
		expect(() => iterator.next()).toThrow(error);
		expect(source.returnSpy).toHaveBeenCalledOnce();
		expect(iterator.next().done).toBe(true);
	});

	test.each([
		{ name: 'outerKey', outerKey: (value: number) => { if (value === 2) throw new Error('outerKey'); return value; }, result: pair },
		{ name: 'result', outerKey: identity, result: (value: number) => { if (value === 2) throw new Error('result'); return value; } }
	])('closes the source and becomes done when $name throws', ({ name, outerKey, result }) => {
		const source = throwingSource(100, new Error('unused'));
		const iterator = innerJoin(source.iterable, [1, 2], outerKey, identity, result as never)[Symbol.iterator]();
		expect(iterator.next().done).toBe(false);
		expect(() => iterator.next()).toThrow(name);
		expect(source.returnSpy).toHaveBeenCalledOnce();
		expect(iterator.next().done).toBe(true);
	});

	test('propagates source errors without closing', () => {
		const error = new Error('source');
		const source = throwingSource(1, error);
		const iterator = innerJoin(source.iterable, [], identity, identity, pair)[Symbol.iterator]();
		expect(() => iterator.next()).toThrow(error);
		expect(source.returnSpy).not.toHaveBeenCalled();
		iterator.return!();
	});

	test('forwards return values once and remains done, also between the matches of one value', () => {
		const source = throwingSource(100, new Error('unused'));
		const iterator = innerJoin(source.iterable, [1, 1], identity, identity, pair)[Symbol.iterator]();
		expect(iterator.next()).toEqual({ done: false, value: [1, 1] });
		expect(iterator.return!('end')).toEqual({ done: true, value: 'end' });
		iterator.return!();
		expect(iterator.next().done).toBe(true);
		expect(source.returnSpy).toHaveBeenCalledExactlyOnceWith('end');
	});

	test('infers the types of the callbacks and of the result', () => {
		const result = innerJoin([1], ['a'], (value, index) => {
			expectTypeOf(value).toEqualTypeOf<number>();
			expectTypeOf(index).toEqualTypeOf<number>();
			return String(value);
		}, value => {
			expectTypeOf(value).toEqualTypeOf<string>();
			return value;
		}, (outer, inner) => {
			expectTypeOf(outer).toEqualTypeOf<number>();
			expectTypeOf(inner).toEqualTypeOf<string>();
			return inner.length > outer;
		});
		expectTypeOf(result).toEqualTypeOf<Iterable<boolean>>();
	});
});
