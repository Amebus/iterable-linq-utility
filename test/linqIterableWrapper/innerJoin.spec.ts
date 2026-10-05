import { describe, expect, expectTypeOf, test } from 'vitest';
import { expectTransformation } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

const identity = <T>(value: T): T => value;

describe('IterableLinq.innerJoin', () => {
	test.each(['outerKey', 'innerKey', 'result'])('rejects an invalid %s', name => {
		const callbacks: Record<string, unknown> = { outerKey: identity, innerKey: identity, result: identity, [name]: null };
		expect(() => IterableLinq.from([1]).innerJoin([1], callbacks.outerKey as never, callbacks.innerKey as never, callbacks.result as never))
			.toThrow(new Error(`[iterable-linq-utility/innerJoin] The "${name}" function must be provided`));
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
});
