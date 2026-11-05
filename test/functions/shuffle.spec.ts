import { afterEach, describe, expect, test, vi } from 'vitest';
import { closableSource } from '../_helpers/generators/closableSource';
import { spyIterable } from '../_helpers/generators/spyIterable';
import { throwingSource } from '../_helpers/generators/throwingSource';
import { expectTransformation } from '../_helpers/operationKind';

import {
	collectToArray,
	range,
	shuffle,
	take
} from '@/functions';
import { mulberry32 } from '@/utils';
import { returnClosesTheIterator, withoutInputIterableThrowsException } from './functionsTestUtility';

const sorted = (values: number[]) => [...values].sort((a, b) => a - b);
const error = (message: string) => new Error(`[iterable-linq-utility/shuffle] ${message}`);
const OUT_OF_RANGE = 'The generator of "random" must return a number from 0 up to, but not including, 1';

describe('shuffle', () => {

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('shuffle without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(shuffle);
	});

	test.each([
		{ returnValue: 'a value' },
		{ returnValue: 123 },
		{ returnValue: null },
		{}
	])('shuffle(range(20))[Symbol.iterator]().return() closes the iterator', ({ returnValue }) => {
		returnClosesTheIterator(shuffle(range(20)), returnValue);
	});

	test('shuffle is transformation', () => {
		expectTransformation(source => shuffle(source));
	});

	test.each([
		{ values: [] },
		{ values: [1] },
		{ values: [1, 1, 2] },
		{ values: Array.from({ length: 1000 }, (_, i) => i) }
	])('shuffle gives a permutation of the $values.length values', ({ values }) => {
		expect(sorted(collectToArray(shuffle(values)))).toEqual(sorted(values));
	});

	test('shuffle does not change an array source', () => {
		const values = [1, 2, 3, 4, 5];
		collectToArray(shuffle(values, { seed: 42 }));
		expect(values).toEqual([1, 2, 3, 4, 5]);
	});

	test('shuffle allows re-run, reading the source again', () => {
		const source = spyIterable([1, 2, 3]);
		const shuffled = shuffle(source);
		collectToArray(shuffled);
		collectToArray(shuffled);
		expect(source.stats.reads).toBe(6);
	});

	test('shuffle reads the whole source before the first value', () => {
		const source = spyIterable([1, 2, 3, 4, 5]);
		const it = shuffle(source)[Symbol.iterator]();
		expect(source.stats.reads).toBe(0);
		it.next();
		expect(source.stats.reads).toBe(5);
	});

	test('an error of the source propagates, without closing the source', () => {
		const sourceError = new Error('source');
		const { returnSpy, iterable } = throwingSource(3, sourceError);
		expect(() => collectToArray(shuffle(iterable))).toThrow(sourceError);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	test('return() after the first value stops the iterator', () => {
		const { state, iterable } = closableSource([1, 2, 3]);
		const it = shuffle(iterable)[Symbol.iterator]();
		it.next();
		expect(state.closed).toBe(true);
		it.return!();
		expect(it.next().done).toBe(true);
	});

	test('iterator stays done', () => {
		const it = shuffle([1, 2])[Symbol.iterator]();
		it.next();
		it.next();
		for (let i = 0; i < 3; i++)
			expect(it.next().done).toBe(true);
	});

	describe('seed', () => {

		test.each([
			{ seed: 42, expected: [6, 5, 8, 7, 1, 3, 4, 2, 9, 0] },
			{ seed: 0, expected: [2, 1, 3, 4, 6, 7, 8, 0, 5, 9] },
			{ seed: 2 ** 32, expected: [2, 1, 3, 4, 6, 7, 8, 0, 5, 9] },
			{ seed: -1, expected: [8, 2, 7, 9, 3, 1, 0, 6, 5, 4] },
			{ seed: 1, expected: [6, 1, 0, 9, 3, 2, 8, 4, 5, 7] }
		])('the order of seed $seed never changes', ({ seed, expected }) => {
			expect(collectToArray(shuffle(range(10), { seed }))).toEqual(expected);
		});

		test('seed repeats the order at every iteration', () => {
			const shuffled = shuffle(range(10), { seed: 42 });
			expect(collectToArray(shuffled)).toEqual(collectToArray(shuffled));
		});

		test('seed repeats the order after an iteration that stopped early', () => {
			const shuffled = shuffle(range(10), { seed: 42 });
			expect(collectToArray(take(shuffled, 3))).toEqual([6, 5, 8]);
			expect(collectToArray(shuffled)).toEqual([6, 5, 8, 7, 1, 3, 4, 2, 9, 0]);
		});

		test('falsy seeds: 0 is a seed, not Math.random', () => {
			const spy = vi.spyOn(Math, 'random');
			collectToArray(shuffle([1, 2, 3], { seed: 0 }));
			expect(spy).not.toHaveBeenCalled();
		});

		test('falsy seeds: an empty string is passed to random', () => {
			const random = vi.fn(() => () => 0);
			collectToArray(shuffle([1, 2, 3], { seed: '', random }));
			expect(random).toHaveBeenCalledWith('');
		});

		test('falsy seeds: an undefined seed uses Math.random', () => {
			const spy = vi.spyOn(Math, 'random');
			collectToArray(shuffle([1, 2, 3], { seed: undefined }));
			expect(spy).toHaveBeenCalledTimes(3);
		});

	});

	describe('no seed', () => {

		test('uses Math.random once per value, read at each iteration', () => {
			const spy = vi.spyOn(Math, 'random').mockReturnValue(0);
			const shuffled = shuffle([1, 2, 3]);
			expect(collectToArray(shuffled)).toEqual([1, 2, 3]);
			expect(spy).toHaveBeenCalledTimes(3);
			spy.mockReturnValue(0.999);
			expect(collectToArray(shuffled)).toEqual([3, 1, 2]);
		});

		test('k swaps: take(k) calls the generator k times', () => {
			const generator = vi.fn(() => 0.5);
			collectToArray(take(shuffle(range(1000), { random: () => generator }), 10));
			expect(generator).toHaveBeenCalledTimes(10);
		});

	});

	describe('random', () => {

		test('string seed: random receives it, and a new generator repeats the order', () => {
			const random = vi.fn((seed: string) => mulberry32(seed.length));
			const shuffled = shuffle(range(10), { seed: 'abc', random });
			expect(collectToArray(shuffled)).toEqual(collectToArray(shuffled));
			expect(random).toHaveBeenCalledWith('abc');
			expect(random).toHaveBeenCalledTimes(2);
		});

		test('factory is called once per iteration, on the first next(), after the source is read', () => {
			const source = spyIterable([1, 2, 3]);
			let readsAtCall = -1;
			const random = vi.fn(() => {
				readsAtCall = source.stats.reads;
				return () => 0;
			});
			const shuffled = shuffle(source, { random });
			const it = shuffled[Symbol.iterator]();
			expect(random).not.toHaveBeenCalled();
			it.next();
			it.next();
			expect(random).toHaveBeenCalledTimes(1);
			expect(readsAtCall).toBe(3);
		});

		test('factory is called on an empty source', () => {
			const random = vi.fn(() => () => 0);
			expect(collectToArray(shuffle([], { random }))).toEqual([]);
			expect(random).toHaveBeenCalledTimes(1);
		});

		test('factory receives undefined without a seed', () => {
			const random = vi.fn((seed: unknown) => {
				expect(seed).toBeUndefined();
				return () => 0;
			});
			collectToArray(shuffle([1], { random }));
			expect(random).toHaveBeenCalledTimes(1);
		});

		test('factory with one shared generator: it continues across iterations', () => {
			const next = mulberry32(1);
			const shuffled = shuffle(range(10), { random: () => next });
			expect(collectToArray(shuffled)).not.toEqual(collectToArray(shuffled));
		});

		test.each([
			{ seed: 1.5 },
			{ seed: null }
		])('seed $seed is not validated with random: it passes unchanged', ({ seed }) => {
			const random = vi.fn(() => () => 0);
			collectToArray(shuffle([1], { seed, random }));
			expect(random).toHaveBeenCalledWith(seed);
		});

	});

	describe('validation, when shuffle is called', () => {

		test.each([
			{ options: null },
			{ options: 1 }
		])('options $options', ({ options }) => {
			expect(() => shuffle([1], options as any)).toThrow(error('The "options" parameter must be an object'));
		});

		test.each([
			{ random: null },
			{ random: 1 }
		])('random $random', ({ random }) => {
			expect(() => shuffle([1], { random } as any)).toThrow(error('The "random" function must be provided'));
		});

		test.each([
			{ seed: 1.5 },
			{ seed: NaN },
			{ seed: null },
			{ seed: 'a' }
		])('seed $seed without random', ({ seed }) => {
			expect(() => shuffle([1], { seed } as any)).toThrow(error('The "seed" parameter must be an integer'));
		});

	});

	describe('errors of random, at the first next()', () => {

		test('random must return a function', () => {
			const { state, iterable } = closableSource([1, 2]);
			const it = shuffle(iterable, { random: (() => 0.5) as any })[Symbol.iterator]();
			expect(() => it.next()).toThrow(error('The "random" function must return a function'));
			expect(state.closed).toBe(true);
			expect(it.next().done).toBe(true);
		});

		test('an error of the factory propagates unchanged', () => {
			const factoryError = new Error('factory');
			const it = shuffle([1], {
				random: () => {
					throw factoryError;
				}
			})[Symbol.iterator]();
			expect(() => it.next()).toThrow(factoryError);
			expect(it.next().done).toBe(true);
		});

		test('an error of the generator propagates unchanged', () => {
			const generatorError = new Error('generator');
			expect(() => collectToArray(shuffle([1], {
				random: () => () => {
					throw generatorError;
				}
			}))).toThrow(generatorError);
		});

		test('after a generator error the iterator is done', () => {
			const generatorError = new Error('generator');
			let calls = 0;
			const generator = () => {
				if (++calls === 3)
					throw generatorError;
				return 0;
			};
			const it = shuffle([1, 2, 3, 4], { random: () => generator })[Symbol.iterator]();
			expect([it.next().value, it.next().value]).toEqual([1, 2]);
			expect(() => it.next()).toThrow(generatorError);
			expect(it.next().done).toBe(true);
		});

	});

	describe('generator values', () => {

		test.each([
			{ value: 1 },
			{ value: -0.1 },
			{ value: 1.5 },
			{ value: NaN },
			{ value: Infinity },
			{ value: false },
			{ value: true },
			{ value: '0.5' },
			{ value: undefined },
			{ value: null }
		])('$value throws, and the iterator is done', ({ value }) => {
			const it = shuffle([1, 2], { random: () => () => value as number })[Symbol.iterator]();
			expect(() => it.next()).toThrow(error(OUT_OF_RANGE));
			expect(it.next().done).toBe(true);
		});

		test.each([
			{ value: 0 },
			{ value: -0 },
			{ value: 0.999999 }
		])('$value is accepted', ({ value }) => {
			const values = collectToArray(shuffle([1, 2], { random: () => () => value }));
			expect(sorted(values)).toEqual([1, 2]);
		});

	});

	describe('uniform', () => {

		const counts = (shuffleAt: (k: number) => Iterable<number>) => {
			const found = new Map<string, number>();
			for (let k = 0; k < 24_000; k++) {
				const permutation = collectToArray(shuffleAt(k)).join('');
				found.set(permutation, (found.get(permutation) ?? 0) + 1);
			}
			return [...found.values()];
		};

		const expectUniform = (values: number[]) => {
			expect(values).toHaveLength(24);
			expect(Math.min(...values)).toBeGreaterThanOrEqual(900);
			expect(Math.max(...values)).toBeLessThanOrEqual(1100);
		};

		test('with one stream', () => {
			const next = mulberry32(1);
			expectUniform(counts(() => shuffle([0, 1, 2, 3], { random: () => next })));
		});

		test('with a seed per shuffle', () => {
			expectUniform(counts(seed => shuffle([0, 1, 2, 3], { seed })));
		});

	});

});
