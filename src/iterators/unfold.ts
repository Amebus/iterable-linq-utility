import { getContinueIteratorResult, getDoneIteratorResult } from '../utils';
import { BaseIterator } from './baseIterator';
import { DeferredIterable } from './deferredIterable';

/**
 * Pure step of `unfold`: returns the value and the next state, or `undefined` to stop.
 */
export type UnfoldStep<S, T> = (state: S) => readonly [value: T, next: S] | undefined;

/**
 * Builds a lazy, re-runnable iterable from a seed and a pure step function.
 */
export function unfold<S, T>(seed: S, step: UnfoldStep<S, T>): Iterable<T> {
	return new DeferredIterable(() => new UnfoldIterator(seed, step));
}

class UnfoldIterator<S, T> extends BaseIterator<T> {
	constructor(private state: S, private readonly step: UnfoldStep<S, T>) {
		super();
	}

	protected advance(): IteratorResult<T> {
		const next = this.step(this.state);
		if (next === undefined)
			return getDoneIteratorResult();
		this.state = next[1];
		return getContinueIteratorResult(next[0]);
	}
}
