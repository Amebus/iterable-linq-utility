import { describe, expect, expectTypeOf, test } from 'vitest';
import { expectTransformation } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

const identity = <T>(value: T): T => value;

describe('IterableLinq.groupJoin', () => {
	test.each(['outerKey', 'innerKey', 'result'])('rejects an invalid %s', name => {
		const callbacks: Record<string, unknown> = { outerKey: identity, innerKey: identity, result: identity, [name]: null };
		expect(() => IterableLinq.from([1]).groupJoin([1], callbacks.outerKey as never, callbacks.innerKey as never, callbacks.result as never))
			.toThrow(new Error(`[iterable-linq-utility/groupJoin] The "${name}" function must be provided`));
	});

	test('rejects an invalid inner', () => {
		expect(() => IterableLinq.from([1]).groupJoin(null as never, identity, identity, identity)).toThrow(new Error('[iterable-linq-utility/groupJoin] The "sourceIterable" must be provided'));
	});

	test('joins each value with the inner values of the same key, and accepts another chain', () => {
		const teams = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }];
		const players = IterableLinq.from([{ team: 1, name: 'x' }, { team: 1, name: 'y' }]);
		const result = IterableLinq.from(teams)
			.groupJoin(players, team => team.id, player => player.team, (team, members) => [team.name, members.length])
			.collectToArray();
		expect(result).toEqual([['a', 2], ['b', 0]]);
	});

	test('is a lazy, re-runnable Transformation', () => {
		expectTransformation(source => IterableLinq.from(source).groupJoin([2, 9], identity, identity, (_, inners) => inners.length));
	});

	test('infers the result type', () => {
		expectTypeOf(IterableLinq.from([1]).groupJoin(['a'], String, identity, (_, inners) => inners)).toEqualTypeOf<IterableLinq.IIterableLinq<string[]>>();
	});
});
