# memoize and materialize give their values as an array

* Status: accepted
* Deciders: Amebus
* Date: 2026-11-14

Technical Story: https://github.com/Amebus/iterable-linq-utility/issues/225

Amends: [ADR 0036](0036-actions-read-an-array-by-index.md), [ADR 0037](0037-count-reads-the-size-and-other-is-copied-with-the-set-constructor.md)

## Context and Problem Statement

[ADR 0036](0036-actions-read-an-array-by-index.md) and [ADR 0037](0037-count-reads-the-size-and-other-is-copied-with-the-set-constructor.md) let `includes`, `indexOf`, `lastIndexOf`, `at`, `findLast`, `findLastIndex` and `count()` read by index an array with the built-in iterator. The iterables returned by `memoize` and `materialize` hold their values too, but the Actions iterate them:

* `memoize` keeps its values in an array, the cache, and gives them through a `MemoizeIterator` that checks the cache and creates an `IteratorResult` at each value. With `allowPartialMemoization: false` (full) the first `next()` reads the whole source into the cache; with partial memoization the cache grows as far as the consumers read, and it is finished when one of them reaches the end. An error of the source is kept in the cache and thrown again by every read past the cached values.
* `materialize` keeps its values in a singly linked list, there since the starting code with no recorded reason: it has no index and cannot be read from the end.

The measurements of #225, on 100,000 numbers in the devcontainer (Node 24, arm64), with a script outside the benchmarks:

* on a full or a finished partial `memoize`, the Actions read the cache by index from 12,000× to 27,000× faster for `count()`, `at(-1)`, and `lastIndexOf` and `findLast` with a match at the end, from 8,000× to 12,000× for `at` in the middle, from 47× to 98× for `includes` with no match and `indexOf` in the middle, and from 15× to 18× for `lastIndexOf` with no match;
* an array built with a `for…of` loop and `push` costs as much as the linked list to build from a `map`, within 5%; an iterator that reads it by index goes, against the one of the list, from 30% slower to 30% faster depending on the values and on the consumer, the same on average; on 1,000,000 objects the array takes 10 MB and the list 40 MB.

Can these Actions read the values of `memoize` and `materialize` by index, and when?

## Decision Drivers

* The result does not depend on how the source is read (ADR 0036)
* The source is read as many times, and as far, as the iteration reads it
* An error of the source is thrown where the iteration throws it
* The common case of `memoize` and `materialize` is the end of a chain, read many times

## Considered Options

* A: `materialize` stores an array; the Actions read by index the array of `materialize`, the cache of a full `memoize` after filling it, and the cache of a finished partial `memoize`; a cache with an error is iterated
* B: A, with the cache with an error read by index and the error thrown when the Action would read past the cached values
* C: A, with `materialize` keeping its linked list
* D: no fast path for `memoize` and `materialize`

## Decision Outcome

Chosen option: "A: the array of `materialize` and the finished caches of `memoize`".

* `materialize` stores its values in the array of `collectToArray`: `Array.from` on an array or a `Set`, a `for…of` loop with `push` on the other iterables, where `Array.from` is about 2× slower (a4c2103). It gives them through an iterator that reads the array by index: the built-in iterator of the array is slower after a `map` or a `filter`. The linked list stays for `reverse`.
* The Actions of ADR 0036 and `count()` of ADR 0037 read their source through `arrayOf` in `src/utils`, which gives an array to read by index, or `undefined`: an array with the built-in iterator (`isPlainArray`); the array of a `materialize`; the cache of a full `memoize`, which `arrayOf` fills first as its first `next()` would; the cache of a partial `memoize` once it is finished. A partial `memoize` that is not finished, and a `memoize` whose cache holds an error, are iterated, so the reads stop and the error is thrown where they do today.
* The iterables of `memoize` and `materialize` give their array through a method whose key is a symbol of `src/utils`, not exported by the package: the user cannot reach the arrays, so they never change once they are given, and no other iterable is recognised.
* The arrays have no holes and the library never changes a value in them: reading by index gives the values of the iteration. Filling a full `memoize` reads the whole source, as its iterator does on its first `next()`, and an error of the source while filling it propagates unchanged, as it does from that `next()`.
* `findLast` and `findLastIndex` call the predicate from the last value backward on these arrays too, as on any array read by index (ADR 0036).
* The chain gains with `Functions`: `from(x).memoize().count()` and `from(x).materialize().at(-1)` pass the iterable of `memoize` or `materialize` to the raw function (ADR 0005). After a Transformation that follows them, nothing changes. `intersect`, `except` and the other operations keep iterating these sources.
* In the benchmarks, against `main`: after `memoize` and `materialize`, `count()` and `at(-1)` from about 10,000× to 16,000× faster, `includes` with no match from +2,181% to +2,959%; `materialize` of an array from +58% to +79% faster, with `Array.from`, and after a `map` or a `filter` from 2% to 10% slower; `count()` of a `Set` or a `Map`, which now calls `arrayOf` first, about 14% slower, a nanosecond on a constant time.

### Positive Consequences

* `count()`, `at`, `lastIndexOf`, `findLast` and `findLastIndex` on a full or finished `memoize`, and on `materialize`, are constant time or read from the end
* `materialize` takes about a quarter of the memory of the linked list
* The Actions use one check, `arrayOf`, for every source they read by index

### Negative Consequences

* `findLast` and `findLastIndex` call the predicate in another order on a `memoize` or a `materialize` than on the chain before them
* A partial `memoize` gains only after one consumer has read it to the end, and a cache with an error never gains
* `arrayOf` adds a property read to each call of the seven Actions on a source that is not an array: `count()` of a `Set` or a `Map` is about 14% slower
* `materialize` after a `map` or a `filter` is up to 10% slower to build and read once
* The specs cover the full, partial, finished and failed caches for each of the seven Actions

## Pros and Cons of the Options

### A: the array of `materialize` and the finished caches of `memoize`

* Good, because every Action gives the result and the reads of the iteration, errors included
* Good, because `materialize` changes complexity and memory
* Bad, because the order of the predicate calls of `findLast` and `findLastIndex` depends on the source

### B: the cache with an error read by index

* Good, because a `memoize` whose source failed gains too
* Bad, because each Action must know whether it reads past the cached values: `at(-1)` and `count()` always throw, `includes` throws only without a match in the cache
* Bad, because the case is rare: a source that throws is usually not read again

### C: `materialize` keeps its linked list

* Good, because `materialize` does not change
* Bad, because the list has no index: `at(-1)`, `count()` and the reads from the end walk the whole list, with four times the memory

### D: no fast path

* Good, because `memoize` and `materialize` do not change
* Bad, because a value stored to be read many times is read by iteration each time
