import { describe, expect, expectTypeOf, test } from 'vitest';

import { shuffle } from '@/functions';
import { from } from '@/index';
import type { IShuffleOptions } from '@/types';

describe('the options of shuffle', () => {

	test('a seed that is not a number needs random', () => {
		// @ts-expect-error a string seed without random
		expect(() => shuffle([1], { seed: 'a' })).toThrow();
	});

	test('random takes the type of the seed', () => {
		const shuffled = shuffle([1], { seed: 'a', random: (s: string) => () => s.length / 10 });
		expectTypeOf(shuffled).toEqualTypeOf<Iterable<number>>();
	});

	test('the seed gives its type to the parameter of random', () => {
		shuffle([1], {
			seed: 'a',
			random: seed => {
				expectTypeOf(seed).toEqualTypeOf<string>();
				return () => 0;
			}
		});
	});

	test('random alone, and a numeric seed alone', () => {
		expectTypeOf(shuffle([1], { random: () => Math.random })).toEqualTypeOf<Iterable<number>>();
		expectTypeOf(shuffle(['a'], { seed: 42 })).toEqualTypeOf<Iterable<string>>();
	});

	test('random alone receives undefined', () => {
		shuffle([1], {
			random: seed => {
				expectTypeOf(seed).toEqualTypeOf<undefined>();
				return () => 0;
			}
		});
	});

	test('a random that needs a seed cannot omit it', () => {
		const needsString = (s: string) => () => s.length / 10;
		const needsNumber = (n: number) => () => n / 10;
		const maybe = 'a' as string | undefined;
		// @ts-expect-error no seed
		shuffle([1], { random: needsString });
		// @ts-expect-error no seed
		shuffle([1], { random: needsNumber });
		// @ts-expect-error an undefined seed
		shuffle([1], { seed: undefined, random: needsString });
		// @ts-expect-error a seed that can be undefined
		shuffle([1], { seed: maybe, random: needsString });
		// @ts-expect-error no seed, on the chain
		from([1]).shuffle({ random: needsString });
		// @ts-expect-error an undefined seed, on the chain
		from([1]).shuffle({ seed: undefined, random: needsNumber });
	});

	test('the options can be held in a variable of the public type', () => {
		const withString: IShuffleOptions<string> = { seed: 'a', random: s => () => s.length / 10 };
		const withNumber: IShuffleOptions = { seed: 1 };
		expectTypeOf(shuffle([1], withString)).toEqualTypeOf<Iterable<number>>();
		expectTypeOf(from([1]).shuffle(withString).collectToArray()).toEqualTypeOf<number[]>();
		expectTypeOf(shuffle([1], withNumber)).toEqualTypeOf<Iterable<number>>();
	});

});
