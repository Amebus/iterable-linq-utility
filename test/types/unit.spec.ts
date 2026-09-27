import { describe, expect, expectTypeOf, test } from 'vitest';

import { Action, Tapper, Unit, unit } from '@/types';

describe('Unit', () => {

	test('only unit() is a Unit', () => {
		expectTypeOf(unit()).toEqualTypeOf<Unit>();
		expectTypeOf<number>().not.toExtend<Unit>();
		expectTypeOf<object>().not.toExtend<Unit>();
		// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- the structural type the old Unit was equal to
		expectTypeOf<{}>().not.toExtend<Unit>();
	});

	test('callbacks must return unit()', () => {
		// @ts-expect-error a number is not a Unit
		const action: Action<number> = v => v;
		// @ts-expect-error a string is not a Unit
		const tapper: Tapper<number> = () => 'x';
		const ok: Action<number> = () => unit();
		expect([action, tapper, ok]).toHaveLength(3);
	});

	test('unit() is a frozen singleton', () => {
		expect(unit()).toBe(unit());
		expect(Object.isFrozen(unit())).toBe(true);
	});

});
