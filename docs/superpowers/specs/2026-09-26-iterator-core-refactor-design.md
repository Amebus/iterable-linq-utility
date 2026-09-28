# Iterator core refactor — design

* Status: proposed
* Date: 2026-09-26
* Branch: `chore/modernize-deps-and-test-helpers`

## Context

Every operator implements its iterator by swapping the function stored in `internalNext` (for example `this.internalNext = getDoneIteratorResult`) instead of keeping an explicit state. The analysis of `src/` showed that this pattern:

* spreads state over several mutable slots. In `LinkedList`, `addLast(1); addFirst(2); addLast(3)` gives `size() === 3` but iterates `[2, 3]`;
* lets a missing transition go unnoticed. The `range` iterator restarts after `done` (`0, 1, 2, done, 4…`);
* is applied differently in each file. Only `map` forwards `return()` to its source, so `filter`, `tap` and `flatMap` leave generator sources open;
* costs about 1.45x more than a `done` flag on `map(filter(range(2e6)))`: 33.6 ms against 23.0 ms. The cost comes from one closure per instance per state and from call sites the JIT cannot inline.

The code also contains 10 almost identical `XxxIterable` classes, duplicated `min`/`max` logic and known bugs in `repeat` and `memoize`.

## Goals

* One place owns the "done" state and `return()` handling for every iterator.
* Operators contain only their own logic, with no state bookkeeping.
* State that has more than two values is explicit data, not a swapped function.
* Fix the known bugs listed under "Behaviour changes", each one covered by a test first.
* Stay at least as fast as today on the reference benchmark.

## Non-goals

* Tail recursion or trampolines. V8 has no tail call optimization: a recursion depth of 100 000 throws `RangeError`. We keep plain loops.
* Changing `Action`/`Tapper` from `Unit` to `void`. That is a separate API decision.
* New operators.

## Design

### Folder layout

A new `src/iterators/` topic folder, following ADR 0001, contains:
* `baseIterator.ts`
* `sourceIterator.ts`
* `deferredIterable.ts`
* `unfold.ts`
* `index.ts`

Operators stay in `src/functions/`.

### `BaseIterator<T>`

```ts
export abstract class BaseIterator<T> implements IterableIterator<T> {
	private done = false;

	next(): IteratorResult<T> {
		if (this.done)
			return getDoneIteratorResult();
		const result = this.advance();
		if (result.done === true)
			this.done = true;
		return result;
	}

	return(value?: any): IteratorResult<T> {
		if (!this.done) {
			this.done = true;
			this.onReturn();
		}
		return getDoneIteratorResult(value);
	}

	[Symbol.iterator](): IterableIterator<T> {
		return this;
	}

	protected abstract advance(): IteratorResult<T>;

	protected onReturn(): void {}
}
```

* `advance()` runs only while the iterator is not done. Once it returns a done result, every later `next()` returns done. This makes the `range` bug impossible for every operator.
* `return()` is idempotent and calls `onReturn()` at most once.

### `SourceIterator<S, T>`

Extends `BaseIterator<T>` for operators that have one upstream iterator.
* It holds `protected readonly source: Iterator<S>` and `protected index = 0`.
* Its `onReturn()` calls `source.return?.()`.
* `map`, `filter` and `tap` derive from it, which fixes `return()` propagation.

### `DeferredIterable<T>`

```ts
export class DeferredIterable<T> implements Iterable<T> {
	constructor(private readonly createIterator: () => Iterator<T>) {}

	[Symbol.iterator](): Iterator<T> {
		return this.createIterator();
	}
}
```

It replaces `MapIterable`, `FilterIterable`, `FlatMapIterable`, `TapIterable`, `TapChainIterable`, `RepeatIterable`, `RangeIterable`, `RangeReverseIterable`, `RangeEmptyIterable` and `EmptyIterable`. Each call to `[Symbol.iterator]()` creates a new iterator, so a chain stays re-runnable.

`MaterializeIterable` and the memoize iterables keep dedicated classes, because they hold state and `materialize`/`memoize` rely on `instanceof` checks against them.

New classes use TypeScript parameter properties instead of repeating field declarations and constructor assignments.

### `unfold(seed, step)`

```ts
export type UnfoldStep<S, T> = (state: S) => readonly [value: T, next: S] | undefined;

export function unfold<S, T>(seed: S, step: UnfoldStep<S, T>): Iterable<T>;
```

`step` is a pure function. It returns the value and the next state, or `undefined` to stop. `unfold` returns a `DeferredIterable` of an `UnfoldIterator extends BaseIterator`. Sources use it:

* `repeat`: `unfold(count, n => n > 0 ? [value, n - 1] : undefined)`.
* `empty`: `unfold(undefined, () => undefined)`.

`unfold` is internal. It is not exported from `src/index.ts`.

### `range`

`range` does **not** use `unfold`. It is the hottest source, so it has a dedicated `RangeIterator extends BaseIterator<number>` with no per-step allocation, wrapped in a `DeferredIterable`:

* The argument normalisation stays as it is today.
* `RangeIterator(first, step, length)` keeps an `index` and yields `first + index * step` while `index < length`.
* Reverse order is a negative `step` with the matching `first`, so one class handles both directions. It replaces `RangeIterable`, `RangeIterator`, `RangeReverseIterable` and `RangeReverseIterator`.
* An empty range returns `empty()`.
* Each value is computed with a multiplication instead of repeated additions, so decimal steps do not accumulate rounding errors.

### Operators

* `map`, `filter`, `tap`: a `SourceIterator` subclass each, with an `advance()` of a few lines. `filter` keeps a plain loop to skip rejected values.
* `tapChain`: `new DeferredIterable(() => { tapper(source, 0); return source[Symbol.iterator](); })`.
* `flatMap`: a `SourceIterator` with an explicit `state: 'outer' | 'inner'` field and a module-level transition table:

  ```ts
  const STEPS: Record<FlatMapState, (it: FlatMapIterator<any, any>) => IteratorResult<any> | undefined> = { outer, inner };
  ```

  * `advance()` loops `STEPS[this.state](this)` until a step returns a result. A step returns `undefined` when it only changed state, for example when an inner iterable is empty.
  * `onReturn()` closes the inner iterator, then the source.
* `forEach`, `forEachAsync`, `reduce`, `some`, `collectToArray`: unchanged apart from style.

### `min` / `max`

* `toCompareFunction(comparer?: Comparer<T>)` moves to `src/utils/`. It turns a function, a key, a list of keys or nothing into a `(a, b) => number`, and replaces the duplicated code.
* A shared `findExtreme(iterable, compare, sign)` seeds the result with the first element only when the iterable is not empty. Today it seeds with `next().value`, which breaks when the first element is `null` or `undefined`.
* **Signature change (breaking):** `min`/`max` return `T | undefined`, and an empty iterable gives `undefined`, like `Array.prototype.find`. Today the return type is `T | null | undefined` and an empty iterable gives `null`. `IIterableLinq` and `IterableLinqWrapper` change accordingly. The 32 test cases that expect `null` change to `undefined`.

### `memoize`

Both modes share one cache object per memoized iterable:

```ts
interface IMemoizeCache<T> {
	readonly values: T[];
	source?: Iterator<T>;
	finished: boolean;
}
```

* **Partial** (`allowPartialMemoization: true`): each consumer is a `BaseIterator` with its own index.
  * `advance()` serves `values[index]` when it exists.
  * Otherwise it pulls one value from the shared source, appends it and serves it. When the source is exhausted it sets `finished`.
  * This fixes interleaved consumers and a `break` that truncated the cache.
* **Full** (`allowPartialMemoization: false`): the first `next()` of any consumer drains the whole source into `values`. Later consumers, and concurrent ones, read from `values`, so the source is evaluated once.
* A consumer's `return()` does **not** close the shared source, because another consumer can still read from it. The source is released, and the reference dropped, when it is exhausted.
* `changePartialMemoizationBehaviour()` and the `instanceof` checks keep their current behaviour.

### `materialize`

It keeps `LinkedList`. `MaterializeIterable` returns the list's own iterator, so it no longer needs a wrapper iterator class.

### `LinkedList`

* The two swapped functions `internalAddFirst`/`internalAddLast` become ordinary methods. Both branch on the single piece of state, `this.tail === null`, which fixes the `addFirst`/`addLast` mix bug.
* `LinkedListIterator` extends `BaseIterator`.

### `repeat` validation

A new validation, `Validations.throwIfNotNonNegativeInteger(value, name)`, replaces `throwIfNegative`. `repeat(value, 2.5)`, `NaN` and `Infinity` throw. Today `2.5` loops forever.

### Iterator result helpers

* `getContinueIteratorResult`/`getDoneIteratorResult` stay. `BaseIterator` and the operators use them.
* Every `internalNext`, `sourceNext`, `fmNext` and `internal*`/`inner*` swapped field disappears.

## Behaviour changes

| Area | Today | After |
|---|---|---|
| Any iterator after `done` | `range` restarts | stays done |
| `return()` on `filter`/`tap`/`flatMap` | source left open | source closed (`finally` runs) |
| `repeat(v, 2.5)` | infinite loop | throws `Error` |
| `memoize` + `break` | cache truncated | cache completed by later consumers |
| `memoize`, interleaved consumers | second consumer ends early | both see every value |
| `LinkedList` `addLast`+`addFirst` | loses nodes | correct |
| `min`/`max` on empty | `null` | `undefined` (**breaking**) |
| `min`/`max` with first element `undefined`/`null` | wrong result | correct |
| `range` with decimal step | accumulates rounding error | `first + i * step` |

Because `min`/`max` change their public signature, the next release bumps the version from `0.0.16` to `0.1.0`.

## Testing

* TDD: for each row of "Behaviour changes", write a failing test first in the matching `test/functions/*.spec.ts` or `test/collections/linkedList.spec.ts`, then fix it.
* New unit tests in `test/iterators/`:
  * `BaseIterator` (done is sticky, `return()` is idempotent, `onReturn` runs once);
  * `DeferredIterable` (one fresh iterator per `[Symbol.iterator]()` call);
  * `unfold`.
* `expectAction`/`expectTransformation` keep passing for every operator.
* All current tests stay green, apart from the intended `null` to `undefined` change for `min`/`max`.
* Performance: the reference benchmark `map(filter(range(2e6)))` must not be slower than today's 33.6 ms on the same machine. The target is the ~23 ms of the flag-based prototype. Record the numbers in the pull request.

## Risks

* `unfold` allocates a tuple per step. This only affects `repeat` and `empty`, because `range` has a dedicated iterator.
* `memoize` keeps a shared source open while it is only partially consumed. This is intentional, and the JSDoc documents it.
* The breaking `min`/`max` change affects users who compare the result with `=== null`.
