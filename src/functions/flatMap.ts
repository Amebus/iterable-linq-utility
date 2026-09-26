import { DeferredIterable, SourceIterator } from '../iterators';
import { Mapper } from '../types';
import { Validations } from '../utils';

/**
 * @operation `Transformation`
 * @param iterable
 * @param mapper
 * @returns
 */
export function flatMap<T, R>(iterable: Iterable<T>, mapper: Mapper<T, Iterable<R>>): Iterable<R> {
	Validations.throwIfNotIterable(iterable);
	Validations.throwIfNotFunction(mapper, 'mapper');
	return new DeferredIterable(() => new FlatMapIterator(iterable, mapper));
}

type FlatMapState = 'outer' | 'inner';

/**
 * A step returns the next result, or `undefined` when it only changed state.
 */
type FlatMapStep = (it: FlatMapIterator<unknown, unknown>) => IteratorResult<unknown> | undefined;

class FlatMapIterator<T, R> extends SourceIterator<T, R> {
	/**
	 * Transition table: one step per state. Static, so the steps can read the iterator's protected members.
	 */
	private static readonly steps: Readonly<Record<FlatMapState, FlatMapStep>> = {
		outer: it => {
			const n = it.source.next();
			if (n.done === true)
				return n;
			it.inner = it.mapper(n.value, it.index++)[Symbol.iterator]();
			it.state = 'inner';
			return undefined;
		},
		inner: it => {
			const n = it.inner!.next();
			if (n.done !== true)
				return n;
			it.inner = undefined;
			it.state = 'outer';
			return undefined;
		}
	};

	private state: FlatMapState = 'outer';
	private inner?: Iterator<R>;

	constructor(iterable: Iterable<T>, private readonly mapper: Mapper<T, Iterable<R>>) {
		super(iterable);
	}

	protected advance(): IteratorResult<R> {
		for (;;) {
			const result = FlatMapIterator.steps[this.state](this as FlatMapIterator<unknown, unknown>);
			if (result !== undefined)
				return result as IteratorResult<R>;
		}
	}

	protected override onReturn(): void {
		this.inner?.return?.();
		super.onReturn();
	}
}
