import { DeferredIterable, InnerLookupIterator } from '../iterators';
import type { Mapper } from '../types';
import { getContinueIteratorResult, Validations } from '../utils';

/**
 * Lazily yields `result(outer, inners)` for each value of `iterable`, with the values of `inner` that have the same key,
 * in the order of `inner`; `inners` is empty when there are none.
 * Before the first value it reads the whole `inner`, so `inner` must be finite; each run reads it again.
 * The keys are compared with `SameValueZero`, like `Map`: `NaN` matches `NaN`, and `null` and `undefined` match themselves.
 * Each call of `result` gets a new array.
 * If a callback throws, or `inner` throws, the source is closed and the error propagates.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`, the outer values
 * @param inner - the `Iterable` whose values are joined to the outer values
 * @param outerKey - called with each value of `iterable` and its index; returns its key
 * @param innerKey - called with each value of `inner` and its index; returns its key
 * @param result - called with each outer value and the array of its inner values; returns the value to yield
 * @returns a lazy, re-runnable `Iterable` with one result for each value of `iterable`
 * @throws Error if `iterable` or `inner` is missing or does not implement `[Symbol.iterator]`, or if `outerKey`, `innerKey` or `result` is not a function
 * @example
 * ```ts
 * const teams = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }];
 * const players = [{ team: 1, name: 'x' }, { team: 1, name: 'y' }];
 * Array.from(Functions.groupJoin(teams, players, t => t.id, p => p.team, (t, ps) => [t.name, ps.length]));
 * // [['a', 2], ['b', 0]]
 * ```
 * @since next
 */
export function groupJoin<T, I, K, R>(
	iterable: Iterable<T>,
	inner: Iterable<I>,
	outerKey: Mapper<T, K>,
	innerKey: Mapper<I, K>,
	result: (outer: T, inners: I[]) => R
): Iterable<R> {
	Validations.throwIfNotIterable(iterable, 'groupJoin');
	Validations.throwIfNotIterable(inner, 'groupJoin');
	Validations.throwIfNotFunction(outerKey, 'outerKey', 'groupJoin');
	Validations.throwIfNotFunction(innerKey, 'innerKey', 'groupJoin');
	Validations.throwIfNotFunction(result, 'result', 'groupJoin');
	return new DeferredIterable(() => new GroupJoinIterator(iterable, inner, outerKey, innerKey, result));
}

class GroupJoinIterator<T, I, K, R> extends InnerLookupIterator<T, I, K, R> {
	constructor(
		iterable: Iterable<T>,
		inner: Iterable<I>,
		outerKey: Mapper<T, K>,
		innerKey: Mapper<I, K>,
		private readonly result: (outer: T, inners: I[]) => R
	) {
		super(iterable, inner, outerKey, innerKey);
	}

	protected advance(): IteratorResult<R> {
		const n = this.source.next();
		if (n.done === true)
			return n;
		// a copy: the callback can change its array without changing the groups of the next values
		const inners = this.matches(n.value)?.slice() ?? [];
		try {
			return getContinueIteratorResult(this.result(n.value, inners));
		} catch (error) {
			this.closeAfterCallbackError();
			throw error;
		}
	}
}
