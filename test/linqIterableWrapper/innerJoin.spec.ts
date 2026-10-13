import { describe, expect, expectTypeOf, test } from 'vitest';
import { expectTransformation } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

const identity = <T>(value: T): T => value;

describe('IterableLinq.innerJoin', () => {
	test.each(['outerKey', 'innerKey', 'result'])('rejects an invalid %s', name => {
		const callbacks: Record<string, unknown> = { outerKey: identity, innerKey: identity, result: identity, [name]: null };
		expect(() => IterableLinq.from([1]).innerJoin([1], callbacks.outerKey as never, callbacks.innerKey as never, callbacks.result as never))
			.toThrow(new Error(`[iterable-linq-utility/innerJoin] The "${name}" ${name === 'result' ? 'function must be provided' : 'must be a function or a property key'}`));
	});

	test('rejects an invalid inner', () => {
		expect(() => IterableLinq.from([1]).innerJoin(null as never, identity, identity, identity)).toThrow(new Error('[iterable-linq-utility/innerJoin] The "sourceIterable" must be provided'));
	});

	test('joins the pairs of values with the same key, and accepts another chain', () => {
		const teams = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }];
		const players = IterableLinq.from([{ team: 1, name: 'x' }, { team: 1, name: 'y' }]);
		const result = IterableLinq.from(teams)
			.innerJoin(players, team => team.id, player => player.team, (team, player) => `${team.name}-${player.name}`)
			.collectToArray();
		expect(result).toEqual(['a-x', 'a-y']);
	});

	test('is a lazy, re-runnable Transformation', () => {
		expectTransformation(source => IterableLinq.from(source).innerJoin([2, 9], identity, identity, identity));
	});

	test('infers the result type', () => {
		expectTypeOf(IterableLinq.from([1]).innerJoin(['a'], String, identity, (_, inner) => inner)).toEqualTypeOf<IterableLinq.IIterableLinq<string>>();
	});

	test('IterableLinq.innerJoin with property keys joins on the properties', () => {
		const teams = [{ id: 1, name: 'red' }, { id: 2, name: 'blue' }];
		const players = [{ teamId: 1, name: 'Ann' }, { teamId: 1, name: 'Cid' }];
		const chain = IterableLinq.from(teams).innerJoin(players, 'id', 'teamId', (t, p) => `${t.name}-${p.name}`);
		expect(chain.collectToArray()).toEqual(IterableLinq.from(teams).innerJoin(players, t => t.id, p => p.teamId, (t, p) => `${t.name}-${p.name}`).collectToArray());
		expectTypeOf(chain).toEqualTypeOf<IterableLinq.IIterableLinq<string>>();
	});
});
