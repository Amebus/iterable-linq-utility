# Iterator Core Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the swapped-function (`internalNext = …`) iterator pattern with a shared `BaseIterator`, a generic `DeferredIterable`, `unfold` for sources and explicit state data. Fix the known iterator bugs along the way.

**Architecture:**
* A new `src/iterators/` folder owns the "done" state and `return()` handling (`BaseIterator`, `SourceIterator`), lazy re-runnable iterables (`DeferredIterable`) and seed-based sources (`unfold`).
* Every operator in `src/functions/` is rewritten on top of these pieces.
* `flatMap` uses a module-level transition table keyed by an explicit `state` field.
* `memoize` uses a shared array cache with one index per consumer.

**Tech Stack:** TypeScript 6.0, Vitest 5 (tests and `vitest bench`), ESLint 10 with `@stylistic`, pnpm 11, run inside the `node-alpine:24.20.0` devcontainer.

**Spec:** `docs/superpowers/specs/2026-09-26-iterator-core-refactor-design.md`

## Global Constraints

- Run every command inside the devcontainer. From the macOS host, prefix it with `docker run --rm -v "$PWD":/w -w /w node-alpine:24.20.0 sh -c '<command>'`, because `node_modules` is built for Linux.
- Code style is enforced by `pnpm lint`: tabs, single quotes, semicolons, and class members in the order fields, constructor, methods (arrow-function fields count as methods). New classes use TypeScript parameter properties.
- No tail recursion and no trampolines. Keep plain loops.
- Do not change `Action`/`Tapper` (`Unit` stays).
- `unfold`, `BaseIterator`, `SourceIterator` and `DeferredIterable` are internal. Do not export them from `src/index.ts`.
- Validation goes through `Validations` in `src/utils/validations.ts` and throws `Error`.
- The package version becomes `0.1.0`, because `min`/`max` change signature.
- Performance gate: `map(filter(range(2e6)))` must not be slower than the baseline recorded in Task 1.
- Every task ends with `pnpm lint`, `pnpm test` and `npx tsc -p tsconfig.build.json --noEmit` all green.
- Commits are in English, end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, and go on branch `chore/modernize-deps-and-test-helpers`.

## Review Focus

1. A user callback that throws (mapper, predicate, tapper) must propagate the same `Error` to the caller, and it must not close or corrupt the iterator silently. Test in Task 3.
2. Two iterators taken from the same chain and advanced alternately must each see the full sequence. Test in Task 3.
3. `return()` on a `flatMap` iterator before the first `next()` must not throw, because there is no inner iterator yet. Test in Task 4.
4. `some` stops early on the first match. It must close the source (the generator `finally` runs), like `for…of` with `break`. Test in Task 3.
5. `min`/`max` with a comparer where every element compares equal must return the first element. Test in Task 5.

---

### Task 1: Iterator core (`BaseIterator`, `SourceIterator`, `DeferredIterable`, `unfold`) + benchmark

**Files:**
- Create: `src/iterators/baseIterator.ts`, `src/iterators/sourceIterator.ts`, `src/iterators/deferredIterable.ts`, `src/iterators/unfold.ts`, `src/iterators/index.ts`
- Create: `test/bench/chain.bench.ts`
- Test: `test/iterators/baseIterator.spec.ts`, `test/iterators/deferredIterable.spec.ts`, `test/iterators/unfold.spec.ts`
- Modify: `package.json` (script `"bench": "vitest bench --run"`)

**Interfaces:**
- Consumes: `getDoneIteratorResult<T>(value?: T)` and `getContinueIteratorResult<T>(value: T)` from `src/utils`.
- Produces:
  - `abstract class BaseIterator<T> implements IterableIterator<T>` with:
    - `next(): IteratorResult<T>`
    - `return(value?: any): IteratorResult<T>`
    - `[Symbol.iterator](): IterableIterator<T>` (returns `this`)
    - `protected abstract advance(): IteratorResult<T>`
    - `protected onReturn(): void` (does nothing by default; write a comment inside the body so `no-empty-function` does not fire)
  - `abstract class SourceIterator<S, T> extends BaseIterator<T>` with:
    - `constructor(iterable: Iterable<S>)`, which sets `protected readonly source: Iterator<S> = iterable[Symbol.iterator]()`
    - `protected index = 0`
    - `onReturn()`, which calls `this.source.return?.()`
  - `class DeferredIterable<T> implements Iterable<T>`, `constructor(private readonly createIterator: () => Iterator<T>)`.
  - `type UnfoldStep<S, T> = (state: S) => readonly [value: T, next: S] | undefined`
  - `function unfold<S, T>(seed: S, step: UnfoldStep<S, T>): Iterable<T>` returns a `DeferredIterable` of an internal `UnfoldIterator<S, T> extends BaseIterator<T>`.
  - `src/iterators/index.ts` re-exports all of the above.

- [ ] **Step 1: Record the baseline benchmark on the current code**

Create `test/bench/chain.bench.ts`:

```ts
import { bench, describe } from 'vitest';
import { filter, map, range } from '../../src/functions';

const sum = (iterable: Iterable<number>) => {
	let s = 0;
	for (const v of iterable) s += v;
	return s;
};

describe('chain', () => {
	bench('map(filter(range(2e6)))', () => {
		sum(map(filter(range(2e6), x => x % 2 === 0), x => x * 2));
	});
	bench('range(2e6)', () => {
		sum(range(2e6));
	});
});
```

Add the `bench` script and run `pnpm bench`. Expected: two rows with `mean` in ms. Write both means into the task notes as the **baseline**.

- [ ] **Step 2: Write the failing tests**

`test/iterators/baseIterator.spec.ts` uses a test subclass `CountTo3 extends BaseIterator<number>`. Its `advance()` returns 1, 2, 3 and then done, and its `onReturn()` increments a `returnCalls` counter.
- `done is sticky`: after `[1,2,3]` and one done result, calling `advance` again would yield 4, but `next()` still returns `{ done: true, value: undefined }` 3 times in a row.
- `return() is idempotent`: `return('x')` returns `{ done: true, value: 'x' }`. Calling it twice leaves `returnCalls === 1`. A following `next()` is done.
- `return() after natural completion does not call onReturn`: `returnCalls === 0`.
- `is its own iterable`: `it[Symbol.iterator]() === it`.

`test/iterators/deferredIterable.spec.ts`:
- `creates a fresh iterator per call`: a factory spy is called once per `[Symbol.iterator]()`, and the two iterators are different objects.
- `re-runnable`: `[...d]` twice over `new DeferredIterable(() => [1, 2][Symbol.iterator]())` gives `[1, 2]` both times.

`test/iterators/unfold.spec.ts`:
- `unfold(0, i => i < 3 ? [i * 10, i + 1] : undefined)` gives `[0, 10, 20]`, and gives it again on a second spread.
- `unfold(0, () => undefined)` gives `[]`.
- `the step is not called before iteration`: a step spy has 0 calls right after `unfold(...)`.
- `stays done`: the iterator returns done and then keeps returning done.

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm vitest run test/iterators`. Expected: FAIL with `Cannot find module '../../src/iterators'`.

- [ ] **Step 4: Implement the four modules and `src/iterators/index.ts` with the Interfaces above**

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm vitest run test/iterators`, then `pnpm lint && pnpm test`. Expected: all green.

- [ ] **Step 6: Commit**

`git add src/iterators test/iterators test/bench package.json`, message `feat(iterators): add BaseIterator, SourceIterator, DeferredIterable and unfold`.

---

### Task 2: Sources on `unfold` (`range`, `repeat`, `empty`) + integer validation

**Files:**
- Modify: `src/functions/range.ts`, `src/functions/repeat.ts`, `src/functions/empty.ts`, `src/utils/validations.ts`
- Test: `test/functions/range.spec.ts`, `test/functions/repeat.spec.ts`, `test/functions/empty.spec.ts`

**Interfaces:**
- Consumes: `unfold`, `DeferredIterable` (Task 1).
- Produces: `Validations.throwIfNotNonNegativeInteger(value: number, name: string): void`, with message `` `The "${name}" parameter must be a non-negative integer` ``. It replaces `throwIfNegative`, which is removed.

- [ ] **Step 1: Write the failing tests**

- `range.spec.ts`:
  - `iterator stays done`: `const it = range(3)[Symbol.iterator]()`; after three values, 3 more `next()` calls are all `{ done: true }`.
  - `decimal step has no accumulated error`: `[...range(0, 1, 0.1)]` equals `Array.from({ length: 10 }, (_, i) => i * 0.1)`.
- `repeat.spec.ts`:
  - `test.each([2.5, NaN, Infinity, -1])('repeat(x, %s) throws', …)`, which checks `expect(() => repeat('x', count)).toThrowError(Error)`.
  - `iterator stays done`, as for `range`.

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm vitest run test/functions/range.spec.ts test/functions/repeat.spec.ts`. Expected:
- FAIL: `range` after done yields `4`;
- `repeat(2.5)` does not throw (guard the test with vitest's default timeout);
- the decimal values differ.

- [ ] **Step 3: Implement**

- `range`: keep the overloads and the argument normalisation (`chosenStart`, `chosenEnd`, `chosenStep`, `chosenLength`, `shouldReverse`).
  - When `chosenLength === 0`, return `empty()`.
  - Otherwise `first = shouldReverse ? chosenStart + (chosenLength - 1) * chosenStep : chosenStart` and `step = shouldReverse ? -chosenStep : chosenStep`, then return `unfold(0, i => i < chosenLength ? [first + i * step, i + 1] : undefined)`.
  - Delete `RangeIterable`, `RangeIterator`, `RangeReverseIterable`, `RangeReverseIterator`, `RangeEmptyIterable` and `RangeEmptyIterator`.
- `repeat`: validate with `throwIfNotNonNegativeInteger(count, 'count')`, then `unfold(count, n => n > 0 ? [value, n - 1] : undefined)`.
- `empty`: `unfold<undefined, T>(undefined, () => undefined)`. Delete its two classes.

- [ ] **Step 4: Update the tests that inspect internals**

In `test/functions/range.spec.ts`, delete every `expect(ranged).toHaveProperty('initialValue' | 'length' | 'step', …)` line. The same tests already assert the generated values with `generatedRange`, so coverage stays. Keep the `toHaveProperty('next')` checks on the iterator.

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm lint && pnpm test && pnpm bench`. Expected:
- all tests green;
- the `range(2e6)` mean is not above the Task 1 baseline.

If it is above, apply the spec's fallback: a dedicated `RangeIterator extends BaseIterator<number>` with the same `first + i * step` arithmetic, used only by `range`. Re-run the bench.

- [ ] **Step 6: Commit**

Message: `refactor(sources): build range, repeat and empty on unfold`. The body lists the fixed bugs (`range` restarting after done, `repeat` with a non-integer count, decimal drift).

---

### Task 3: `map`, `filter`, `tap`, `tapChain` on the core; `some` closes the source

**Files:**
- Modify: `src/functions/map.ts`, `src/functions/filter.ts`, `src/functions/tap.ts`, `src/functions/tapChain.ts`, `src/functions/some.ts`
- Create: `test/_helpers/closableSource.ts`
- Test: `test/functions/map.spec.ts`, `test/functions/filter.spec.ts`, `test/functions/tap.spec.ts`, `test/functions/some.spec.ts`

**Interfaces:**
- Consumes: `SourceIterator`, `DeferredIterable` (Task 1).
- Produces:
  - `closableSource(values: number[]): { state: { closed: boolean }; iterable: Iterable<number> }` in `test/_helpers/closableSource.ts`, reused by Tasks 4 and 7;
  - no new public API. The internal classes are `MapIterator<T, R>`, `FilterIterator<T>` and `TapIterator<T>`, each extending `SourceIterator`.

- [ ] **Step 1: Write the failing tests**

All of them use the shared helper `test/_helpers/closableSource.ts`:

```ts
function closableSource(values: number[]) {
	const state = { closed: false };
	const iterable = { *[Symbol.iterator]() { try { yield* values; } finally { state.closed = true; } } };
	return { state, iterable };
}
```

- `map`, `filter`, `tap`, each with a test `return() closes the source`: take an iterator on the operator, read one value, call `return()`, then `expect(state.closed).toBe(true)`.
- `map`: `a throwing mapper propagates the same error`:

  ```ts
  const err = new Error('boom');
  expect(() => collectToArray(map([1], () => { throw err; }))).toThrow(err);
  ```

- `filter`: `independent iterators over the same chain`: `const f = filter([1, 2, 3, 4], v => v % 2 === 0)`. Take two iterators `a` and `b` and call `a.next(), b.next(), a.next(), b.next()`. The values are `2, 2, 4, 4`.
- `some`: `stopping early closes the source`: `some(iterable, v => v === 1)` on `closableSource([1, 2, 3])` returns `true`, and `state.closed === true`.

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm vitest run test/functions/{map,filter,tap,some}.spec.ts`. Expected: FAIL on `closed` for `filter`, `tap` and `some`. `map` already closes its source; its test passes today and stays.

- [ ] **Step 3: Implement**

- `map`: `return new DeferredIterable(() => new MapIterator(iterable, mapper))`. `advance()` maps `source.next()` with `this.index++`.
- `filter`: `advance()` loops over `source.next()` until the result is done or the predicate accepts the value.
- `tap`: calls the tapper, then passes the source result through.
- `tapChain`: `new DeferredIterable(() => { tapper(iterable, 0); return iterable[Symbol.iterator](); })`.
- `some`: after the predicate returns `true`, call `iterator.return?.()` before returning `true`.
- Delete every `XxxIterable`/`XxxIterableIterator` class in these files.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm lint && pnpm test`. Expected: all green, including `expectTransformation`/`expectAction`.

- [ ] **Step 5: Commit**

Message: `refactor(operators): rebuild map, filter, tap and tapChain on SourceIterator`. The body says `return()` now closes the source and `some` closes it on early exit.

---

### Task 4: `flatMap` with an explicit state and a transition table

**Files:**
- Modify: `src/functions/flatMap.ts`
- Test: `test/functions/flatMap.spec.ts`

**Interfaces:**
- Consumes: `SourceIterator`, `DeferredIterable`, `closableSource` (Task 3).
- Produces:
  - internal `type FlatMapState = 'outer' | 'inner'`;
  - `class FlatMapIterator<T, R> extends SourceIterator<T, R>` with fields `state: FlatMapState = 'outer'` and `inner?: Iterator<R>`;
  - `const STEPS: Record<FlatMapState, (it: FlatMapIterator<unknown, unknown>) => IteratorResult<unknown> | undefined>`.

- [ ] **Step 1: Write the failing tests**

- `return() closes inner and source`: build the source with `closableSource([1])`, and have the mapper return a second `closableSource([10, 20])`. Read one value (`10`), call `return()`, and check that both `closed` flags are `true`.
- `return() before next() does not throw`: `expect(() => flatMap([1], v => [v])[Symbol.iterator]().return()).not.toThrow()`.
- `empty inner iterables are skipped`: `[...flatMap([[], [1], [], [2, 3], []], v => v)]` equals `[1, 2, 3]`.

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm vitest run test/functions/flatMap.spec.ts`. Expected: FAIL on the two `closed` flags.

- [ ] **Step 3: Implement**

```ts
// advance(): the only loop; a step returns undefined when it only changed state
protected advance(): IteratorResult<R> {
	for (;;) {
		const result = STEPS[this.state](this);
		if (result !== undefined)
			return result;
	}
}
```

- `outer` step: pull from `source`.
  - If the source is done, return that done result.
  - Otherwise set `inner = mapper(value, index++)[Symbol.iterator]()`, set `state = 'inner'`, and return `undefined`.
- `inner` step: pull from `inner`.
  - If it has a value, return it.
  - If it is done, set `state = 'outer'`, clear `inner`, and return `undefined`.
- `onReturn()`: call `this.inner?.return?.()`, then `super.onReturn()`.
- `STEPS` and the step functions are module-level `const`s, not class fields. Remove `throw()`.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm lint && pnpm test`. Expected: all green.

- [ ] **Step 5: Commit**

Message: `refactor(flatMap): explicit state with a transition table`.

---

### Task 5: `min`/`max` shared compare and `T | undefined` (breaking)

**Files:**
- Create: `src/utils/compare.ts` (export it from `src/utils/index.ts`)
- Modify: `src/functions/min.ts`, `src/functions/max.ts`, `src/linqIterable.ts`, `package.json` (`"version": "0.1.0"`), `documentation/docs/api-reference/actions.md` (the `min`/`max` sections: an empty input returns `undefined`)
- Test: `test/functions/min.spec.ts`, `test/functions/max.spec.ts`, `test/linqIterableWrapper/min.spec.ts`, `test/linqIterableWrapper/max.spec.ts`

**Interfaces:**
- Produces:
  - `toCompareFunction<T>(comparer?: Comparer<T>): (a: T, b: T) => number`. It handles nothing, a function, a key, or an array of keys, with the same semantics as today's inline code.
  - `findExtreme<T>(iterable: Iterable<T>, compare: (a: T, b: T) => number, sign: 1 | -1): T | undefined`. It keeps the first element among equals.
  - `min`/`max` and `IIterableLinq.min`/`max` return `T | undefined`.

- [ ] **Step 1: Write the failing tests**

- In the four specs, replace `expectedResult: null` with `expectedResult: undefined` (8 in each file, 32 in total).
- New cases in `test/functions/max.spec.ts` and `min.spec.ts`:
  - `max([undefined, 1])` is `1`, `max([null, 3])` is `3`, `min([1, null, 0])` is `0`. With the default comparer, `null`/`undefined` never win against a number.
  - `all equal keeps the first`: `max([{ v: 1, id: 'a' }, { v: 1, id: 'b' }], 'v')` has `.id === 'a'`, and the same holds for `min`.

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm vitest run test/functions/min.spec.ts test/functions/max.spec.ts`. Expected: FAIL (`null` received, and wrong seed).

- [ ] **Step 3: Implement**

- Build `compare.ts` from the code that `min.ts`/`max.ts` duplicate today.
- `findExtreme` seeds from the first **non-done** `next()`. It skips a candidate that is `null`/`undefined` while the current best is not. It replaces the best only when `sign * compare(candidate, best) > 0`.
- `min` is `findExtreme(iterable, toCompareFunction(comparer), -1)`, and `max` uses `1`.
- Keep `Validations.throwIfNotIterable` at the start.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm lint && pnpm test && npx tsc -p tsconfig.build.json --noEmit`. Expected: all green.

- [ ] **Step 5: Commit**

Message: `feat!: min and max return undefined on empty input`. The body explains the breaking change, the fixed seed, the shared compare and the version `0.1.0`.

---

### Task 6: `LinkedList` single state + `materialize`

**Files:**
- Modify: `src/collections/linkedList.ts`, `src/functions/materialize.ts`
- Test: `test/collections/linkedList.spec.ts`

**Interfaces:**
- Consumes: `BaseIterator`.
- Produces: `LinkedList<T>` with the same public API (`addFirst`, `addLast`, `size`, `[Symbol.iterator]`). `LinkedListIterator<T>` now extends `BaseIterator<T>`, and its constructor still takes `(current: IListNode<T> | null)`.

- [ ] **Step 1: Write the failing test**

`mixed addFirst/addLast keeps every node`: after `new LinkedList<number>().addLast(1).addFirst(2).addLast(3).addFirst(4)`, `[...list]` equals `[4, 2, 1, 3]` and `size()` is `4`.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run test/collections`. Expected: FAIL (nodes lost).

- [ ] **Step 3: Implement**

- `addFirst` and `addLast` become ordinary methods that branch on `this.tail === null`. Remove the `internalAddFirst`/`internalAddLast` fields.
- `LinkedListIterator.advance()` returns the current node's data and moves to `nextNode`, or returns done when the current node is `null`. Remove its `internalNext` field and its own `return()`: `BaseIterator` provides it.
- `MaterializeIterable[Symbol.iterator]()` returns `this.source[Symbol.iterator]()` directly. Delete `MaterializeIterableIterator`. The `source` field name stays, because `materialize.spec.ts` reads it.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm lint && pnpm test`. Expected: all green.

- [ ] **Step 5: Commit**

Message: `fix(collections): LinkedList keeps nodes when addFirst and addLast are mixed`.

---

### Task 7: `memoize` with a shared array cache

**Files:**
- Modify: `src/functions/memoize.ts`
- Test: `test/functions/memoize.spec.ts`

**Interfaces:**
- Consumes: `BaseIterator`, `closableSource` (Task 3).
- Produces:
  - internal `interface IMemoizeCache<T> { readonly values: T[]; source?: Iterator<T>; finished: boolean }`;
  - `MemoizeAsPartialIterable<T>` and `MemoizeAsFullIterable<T>` keep their names, their `instanceof` role and `changePartialMemoizationBehaviour()`;
  - `IMemoizeOptions` and `getMemoizeDefaultOptions()` do not change.

- [ ] **Step 1: Write the failing tests**

- `partial: break then full read completes the cache`: `const m = memoize(closableSource([1,2,3,4,5]).iterable)`, then `for (const v of m) if (v === 2) break;`, then `collectToArray(m)` equals `[1, 2, 3, 4, 5]`.
- `partial: interleaved consumers see every value`: with `a` and `b` on `memoize([1, 2, 3, 4])`, calling `a, b, a, b` gives values `1, 1, 2, 2`.
- `full: concurrent consumers evaluate the source once`: tap the source with a spy, use `allowPartialMemoization: false`, open two iterators and read from both. The spy is called 5 times for 5 values.
- `partial: consumer return() does not close the shared source`: after `break` on `closableSource`, `state.closed === false`. After a full read, the source is exhausted and the `finally` has run.

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm vitest run test/functions/memoize.spec.ts`. Expected: FAIL on the break and the interleave tests.

- [ ] **Step 3: Implement**

- Each memoize iterable owns one `IMemoizeCache<T>`. Its `source` is created on the first pull, and set back to `undefined` when `finished` becomes true.
- The partial consumer's `advance()`:
  - returns `values[index++]` when present;
  - else, if `finished`, returns done;
  - else pulls one value from the source, appends it and serves it.
- The full consumer's first `advance()` drains the source into `values` when `finished` is false, then serves by index.
- Consumers do not override `onReturn()`.
- Delete `LinkedList` usage and the old iterator classes from this file.
- JSDoc on `memoize`: "A consumer that stops early keeps the shared source open until another consumer finishes it."

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm lint && pnpm test`. Expected: all green, including the existing tapper-count tests.

- [ ] **Step 5: Commit**

Message: `fix(memoize): shared array cache with one index per consumer`.

---

### Task 8: Final sweep and performance gate

**Files:**
- Modify: whatever the checks below report. Expect `src/utils/iteratorResults.ts` and the leftover imports.

- [ ] **Step 1: No swapped-function state is left**

Run: `grep -rnE "internalNext|sourceNext|fmNext|internalAdd|innerNext" src`. Expected: no output.

- [ ] **Step 2: Full verification**

Run: `pnpm lint && pnpm test && pnpm build && npx tsc -p tsconfig.build.json --noEmit`. Expected: all green, and `dist/index.d.ts` shows `min`/`max` returning `T | undefined`.

- [ ] **Step 3: Performance gate**

Run: `pnpm bench`. Expected: the `map(filter(range(2e6)))` mean is not above the Task 1 baseline. Record both numbers for the pull request.

- [ ] **Step 4: Commit any leftovers**

Only if Step 1 or Step 2 required changes. Message: `chore: remove leftovers of the swapped-function iterators`.
