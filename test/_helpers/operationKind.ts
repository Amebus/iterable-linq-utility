import { expect } from 'vitest';

import { isFunction } from '@/utils';

export interface ISpyIterableStats {
	/** Number of times `[Symbol.iterator]` has been called */
	iterations: number;
	/** Number of values read from the source */
	reads: number;
}

export interface ISpyIterable<T> extends Iterable<T> {
	readonly stats: ISpyIterableStats;
}

/**
 * Test-only source that records how it is consumed
 * @param values the values yielded on every iteration
 */
export function spyIterable<T>(values: T[]): ISpyIterable<T> {
	const stats: ISpyIterableStats = { iterations: 0, reads: 0 };
	return {
		stats,
		*[Symbol.iterator]() {
			stats.iterations++;
			for (const value of values) {
				stats.reads++;
				yield value;
			}
		}
	};
}

export type Operation = (source: Iterable<number>) => unknown;

export interface IExpectTransformationOptions {
	/** Each consumption of the result iterates the source again. Default `true` */
	rerunsSource?: boolean;
}

function createSource() {
	return spyIterable([1, 2, 3, 4, 5]);
}

/**
 * Asserts that `operation` is a `Transformation`:
 * it does not read the source when called, returns an `Iterable`
 * and reads the source only when the result is consumed
 */
export function expectTransformation(operation: Operation, options?: IExpectTransformationOptions): void {
	const { rerunsSource = true } = options ?? {};
	const source = createSource();

	const result = operation(source) as Iterable<unknown>;
	expect(source.stats, 'a Transformation must not read the source when called').toEqual({ iterations: 0, reads: 0 });
	expect(isFunction(result?.[Symbol.iterator]), 'a Transformation must return an Iterable').toBe(true);

	Array.from(result);
	expect(source.stats.reads, 'a Transformation must read the source when consumed').toBeGreaterThan(0);

	if (!rerunsSource)
		return;
	Array.from(result);
	expect(source.stats.iterations, 'a Transformation must iterate the source again on every consumption').toBe(2);
}

/**
 * Asserts that `operation` is an `Action`: it reads the source when called
 * @returns the result of `operation`, so that the caller can inspect or await it
 */
export function expectAction(operation: Operation): unknown {
	const source = createSource();

	const result = operation(source);
	expect(source.stats.reads, 'an Action must read the source when called').toBeGreaterThan(0);

	return result;
}
