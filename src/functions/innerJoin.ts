import { DeferredIterable, InnerLookupIterator } from '../iterators';
import type { Mapper } from '../types';
import { getContinueIteratorResult, Validations } from '../utils';

/**
 * Lazily yields `result(outer, inner)` for each pair of a value of `iterable` and a value of `inner` with the same key:
 * in the order of `iterable`, and for each outer value in the order of `inner`. An outer value without a match yields nothing.
 * Named `innerJoin` because `join` is the string join of `Array.prototype`.
 * Before the first value it reads the whole `inner`, so `inner` must be finite; each run reads it again.
 * The keys are compared with `SameValueZero`, like `Map`: `NaN` matches `NaN`, and `null` and `undefined` match themselves.
 * If a callback throws, or `inner` throws, the source is closed and the error propagates.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`, the outer values
 * @param inner - the `Iterable` whose values are joined to the outer values
 * @param outerKey - called with each value of `iterable` and its index; returns its key
 * @param innerKey - called with each value of `inner` and its index; returns its key
 * @param result - called with each pair of values with the same key; returns the value to yield
 * @returns a lazy, re-runnable `Iterable` with one result for each pair of values with the same key
 * @throws Error if `iterable` or `inner` is missing or does not implement `[Symbol.iterator]`, or if `outerKey`, `innerKey` or `result` is not a function
 * @example
 * ```ts
 * const teams = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }];
 * const players = [{ team: 1, name: 'x' }, { team: 1, name: 'y' }];
 * Array.from(Functions.innerJoin(teams, players, t => t.id, p => p.team, (t, p) => `${t.name}-${p.name}`));
 * // ['a-x', 'a-y']
 * ```
 * @since 0.12.0
 */
export function innerJoin<T, I, K, R>(
	iterable: Iterable<T>,
	inner: Iterable<I>,
	outerKey: Mapper<T, K>,
	innerKey: Mapper<I, K>,
	result: (outer: T, inner: I) => R
): Iterable<R> {
	Validations.throwIfNotIterable(iterable, 'innerJoin');
	Validations.throwIfNotIterable(inner, 'innerJoin');
	Validations.throwIfNotFunction(outerKey, 'outerKey', 'innerJoin');
	Validations.throwIfNotFunction(innerKey, 'innerKey', 'innerJoin');
	Validations.throwIfNotFunction(result, 'result', 'innerJoin');
	return new DeferredIterable(() => new InnerJoinIterator(iterable, inner, outerKey, innerKey, result));
}

class InnerJoinIterator<T, I, K, R> extends InnerLookupIterator<T, I, K, R> {
	/** The current outer value, and its inner values not yielded yet: from `position` to the end of `pending`. */
	private outer: T | undefined;
	private pending: I[] | undefined;
	private position = 0;

	constructor(
		iterable: Iterable<T>,
		inner: Iterable<I>,
		outerKey: Mapper<T, K>,
		innerKey: Mapper<I, K>,
		private readonly result: (outer: T, inner: I) => R
	) {
		super(iterable, inner, outerKey, innerKey);
	}

	protected advance(): IteratorResult<R> {
		while (this.pending === undefined || this.position === this.pending.length) {
			const n = this.source.next();
			if (n.done === true)
				return n;
			this.outer = n.value;
			this.pending = this.matches(n.value);
			this.position = 0;
		}
		const inner = this.pending[this.position++];
		try {
			return getContinueIteratorResult(this.result(this.outer as T, inner));
		} catch (error) {
			this.closeAfterCallbackError();
			throw error;
		}
	}

	protected override onReturn(value?: any): void {
		this.outer = undefined;
		this.pending = undefined;
		super.onReturn(value);
	}
}
