# Actions read an array by index

* Status: accepted
* Deciders: Amebus
* Date: 2026-11-09

Technical Story: https://github.com/Amebus/iterable-linq-utility/issues/138

## Context and Problem Statement

Every Action reads its source through `[Symbol.iterator]`. On an array the native methods do better: `Array.prototype.includes` and `indexOf` scan the storage directly, `Set.prototype.has` is a hash lookup, and the methods that look from the end (`lastIndexOf`, `findLast`, `findLastIndex`, `at` with a negative index) start from the last index and stop at the first match, while an iterable can only be read from the start, to the end. The benchmarks of #138 measured, on 100,000 numbers, the native method about 2× faster for `includes`, 4.5× for `indexOf`, 1,600× for `lastIndexOf` with a match at the end and from 700× to 6,500× for `at`.

An array is also the most common source of a chain, and the source that `Functions` receives most often. After a Transformation the source is a `DeferredIterable`, which has no index.

When can an Action read its source as an array, and what must stay the same when it does?

## Decision Drivers

* The result of an Action does not depend on how it reads the source
* An iterator that the user gives an array is respected
* The gain is a change of complexity for the operations that look from the end
* A callback is called as the native counterpart calls it, when the library follows it (ADR 0006, 0024)
* The library targets ES2019: `Array.prototype.at`, `findLast` and `findLastIndex` may be missing at run time

## Considered Options

* A: an Action reads by index an array whose `[Symbol.iterator]` is the built-in one, and `includes` a `Set` with the built-in iterator through `Set.prototype.has`; `findLast` and `findLastIndex` read the array from the end, like their native counterparts
* B: A, with `Array.isArray` as the only check
* C: A without `findLast` and `findLastIndex`, the only Actions with a callback
* D: no fast path: every Action iterates its source

## Decision Outcome

Chosen option: "A: by index, with the built-in iterator".

* An Action reads its source by index when it is an `Array` (`Array.isArray`) whose `[Symbol.iterator]` is `Array.prototype[Symbol.iterator]`, checked at each call by `isPlainArray` in `src/utils`. `includes` also calls `Set.prototype.has` on a `Set` whose `[Symbol.iterator]` is `Set.prototype[Symbol.iterator]` (`isPlainSet`). An array or a `Set` with its own iterator is iterated, like any other iterable.
* The fast path gives the result of the iteration. The native methods are called from the prototype (`Array.prototype.includes.call`), so a subclass that redefines them changes nothing. The iteration reads a hole of a sparse array as `undefined`: `includes` and `at` do too, while the native `indexOf` and `lastIndexOf` skip the holes, so `indexOf(undefined)` uses a loop by index and `lastIndexOf` always does. `at` is a direct access, `array[i]` for `0 <= i < length`, because `Array.prototype.at` is newer than ES2019.
* The fast path covers `includes`, `indexOf`, `lastIndexOf`, `at`, `findLast` and `findLastIndex`. `lastIndexOf` reads from the end and stops at the first match. `findLast` and `findLastIndex` read the length once, call the predicate from the last value backward and stop at the first match, like `Array.prototype.findLast` and `findLastIndex`: the result is the same for a predicate without side effects, while a predicate with side effects, or one that throws on some values, sees fewer calls, in the opposite order. The JSDoc and the API reference say so.
* The chain gives the fast path to `from(array)` with no operation before it, because the chain method passes its source to the raw function (ADR 0005). After a Transformation nothing changes.
* An array read by index has no iterator to close, so ADR 0008 has nothing to close there; the errors of a predicate propagate unchanged (ADR 0020).
* On 100,000 numbers (Node 24.20, arm64, in the devcontainer), against the iteration of `main`: `includes` +441% with no match and +4,128% with a match in the middle, `indexOf` +354% and +351%, `lastIndexOf` +213% in the middle and about 1,900× with a match at the end, `at` from 730× to 9,500×, `findLast` and `findLastIndex` +109% and +280% in the middle, and from 14,000× to 25,000× with a match at the end. `lastIndexOf` with no match is as fast as before: the native method is slower than the iteration there (6,400 against 10,000 ops/s), which is why it uses a loop.

### Positive Consequences

* `from(array)` and `Functions` on an array are as fast as the native methods, or faster, for the six Actions
* `at`, `lastIndexOf`, `findLast` and `findLastIndex` go from linear to the distance from the end, on an array
* An array with its own iterator, or a subclass with its own methods, gives the same result as before

### Negative Consequences

* `findLast` and `findLastIndex` call the predicate in a different order, and fewer times, on an array than on another source with the same values; a predicate with side effects sees the difference
* Each of the six Actions has two paths, both tested, and a check on each call
* An array from another realm has another `Array.prototype[Symbol.iterator]`, so it is iterated; a typed array and `arguments` are iterated too, since `Array.isArray` is `false` for them
* A proxy of an array is read by index: its traps see `length` and the indices, not `[Symbol.iterator]` and the iterator, with the same result
* The other Actions keep reading through the iterator

## Pros and Cons of the Options

### A: by index, with the built-in iterator

* Good, because the results do not change, for every array the user can build
* Good, because the operations that look from the end change complexity
* Good, because `findLast` and `findLastIndex` call the predicate as their native counterparts do
* Bad, because the order of the predicate calls of `findLast` and `findLastIndex` depends on the source

### B: `Array.isArray` as the only check

* Good, because it is one check fewer, and it is the check of `collectToArray`
* Bad, because an array with its own iterator would be read without it: `collectToArray` does not have the problem, because `Array.from` calls the iterator

### C: no fast path for `findLast` and `findLastIndex`

* Good, because the predicate is called in the same order on every source
* Bad, because the two Actions keep reading the whole array when the match is at the end, where the native methods stop at once

### D: no fast path

* Good, because each Action keeps one path
* Bad, because the library stays from 2× to thousands of times slower than the native methods on its most common source
