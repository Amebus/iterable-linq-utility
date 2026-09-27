import { describe, expect, test } from 'vitest';

import * as IterableLinq from '@/index';
import { empty, from, fromRange, isIterableLinq, repeat } from '@/index';
import { unit } from '@/types';

describe('isIterableLinq', () => {

	test.each([
		{ name: 'from', chain: () => from([1]) },
		{ name: 'fromRange', chain: () => fromRange(3) },
		{ name: 'repeat', chain: () => repeat(1, 2) },
		{ name: 'empty', chain: () => empty() },
		{ name: 'map', chain: () => from([1]).map(v => v) }
	])('$name returns a chain', ({ chain }) => {
		expect(isIterableLinq(chain())).toBe(true);
	});

	test.each([
		{ name: 'array', value: [] },
		{ name: 'null', value: null },
		{ name: 'undefined', value: undefined },
		{ name: 'plain object', value: {} },
		{ name: 'string', value: 'abc' },
		{ name: 'generator', value: (function* () { yield 1; })() },
		{ name: 'Set', value: new Set([1]) }
	])('$name is not a chain', ({ value }) => {
		expect(isIterableLinq(value)).toBe(false);
	});

	test('tapChainCreation passes a chain', () => {
		let seen = false;
		from([1]).tapChainCreation(chain => {
			seen = isIterableLinq(chain);
			return unit();
		});
		expect(seen).toBe(true);
	});

	test('the wrapper class is not exported', () => {
		expect('IterableLinqWrapper' in IterableLinq).toBe(false);
	});

});
