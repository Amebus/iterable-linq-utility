import { describe, expect, expectTypeOf, test } from 'vitest';

import { shuffle } from '@/functions';

describe('the options of shuffle', () => {

	test('a seed that is not a number needs random', () => {
		// @ts-expect-error a string seed without random
		expect(() => shuffle([1], { seed: 'a' })).toThrow();
	});

	test('random takes the type of the seed', () => {
		const shuffled = shuffle([1], { seed: 'a', random: (s: string) => () => s.length / 10 });
		expectTypeOf(shuffled).toEqualTypeOf<Iterable<number>>();
	});

	test('random alone, and a numeric seed alone', () => {
		expectTypeOf(shuffle([1], { random: () => Math.random })).toEqualTypeOf<Iterable<number>>();
		expectTypeOf(shuffle(['a'], { seed: 42 })).toEqualTypeOf<Iterable<string>>();
	});

});
