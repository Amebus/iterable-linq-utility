# count reads the size, and other is copied with the Set constructor

* Status: accepted, amended by [ADR 0038](0038-memoize-and-materialize-give-their-values-as-an-array.md)
* Deciders: Amebus
* Date: 2026-11-14

Technical Story: https://github.com/Amebus/iterable-linq-utility/issues/223

Amends: [ADR 0036](0036-actions-read-an-array-by-index.md)

## Context and Problem Statement

[ADR 0036](0036-actions-read-an-array-by-index.md) lets six Actions read an array with the built-in iterator by index, and `includes` call `Set.prototype.has` on a `Set`, with the result of the iteration. Other operations know, from the type of their source, something that the iteration finds only at the end:

* `count()` without a predicate reads the whole source to find a number that an array, a `Set` and a `Map` already hold: `length` and `size`;
* `intersect` and `except` read the whole `other` into a `Set` of keys before the first value, adding the values one by one, even when `other` is already a `Set` or an array;
* `distinct` keeps a `Set` of the values seen, which on a `Set` without a key selector never rejects a value;
* `collectToArray` uses `Array.from` on an array or a `Set`, and could on a `Map`.

The measurements of #223, on 100,000 values in the devcontainer (Node 24, arm64), with a script outside the benchmarks:

* `count()`: 1,304 ops/s on a `Set`, 536 on a `Map`, 886 on an array, against a constant time for `size` and `length`;
* the keys of `other`: 112 ops/s with the loop from a `Set` and 535 with `new Set(other)`, 111 and 154 from an array, while from a generator, an iterator object and an iterator helper `new Set(other)` goes from 16% slower to 5% faster than the loop;
* `distinct` on a `Set`: 147 ops/s with the `Set` of the values seen, 1,707 without it;
* `collectToArray` on a `Map`: 314 ops/s with the loop, 291 with `Array.from`.

`intersect` deletes from its `Set` of keys each key it yields, and `except` adds to it each key it yields, so the `Set` of keys cannot be `other` itself.

Which of these shortcuts does the library take, and under which rule?

## Decision Drivers

* The result does not depend on how the source is read (ADR 0036)
* `other` is read once, before the first value, and is never changed
* A shortcut is taken only where it was measured to be faster
* A guarantee of an operation does not depend on its source

## Considered Options

* A: `count()` and the copy of `other` with the `Set` constructor, on a source with the built-in iterator
* B: A, and `distinct` without the `Set` of the values seen on a `Set`
* C: A, with the `Set` constructor on every `other`, whatever its iterator
* D: no shortcut beyond ADR 0036

## Decision Outcome

Chosen option: "A: `count()` and the copy of `other`".

* `count()` without a predicate returns the `length` of an array with the built-in iterator (`isPlainArray`), and the `size` of a `Set` or of a `Map` with the built-in iterator (`isPlainSet`, `isPlainMap` in `src/utils`). `size` is read with the getter of `Set.prototype` or `Map.prototype`, so a subclass that redefines it changes nothing; `length` cannot be redefined. A hole of a sparse array is counted, as the iteration counts it. `count(predicate)` still calls the predicate on every value.
* `intersect` and `except` without a key selector copy an `other` that is a `Set` or an array with the built-in iterator with `new Set(other)`, instead of adding its values one by one. The copy is the same `Set` of keys: it is made once per run, before the first value, inside the same `try` that closes the source when reading `other` throws, and `other` is never changed. A change to `other` during a run is seen by the next run, as before. With a key selector, a property key, or another `other`, the loop stays.
* `distinct` keeps the `Set` of the values seen on every source. Without it, a `Set` that is changed while it is read, a value deleted and added again, yields that value twice, and `distinct` would no longer guarantee that each value is yielded once.
* `collectToArray` keeps the loop on a `Map`: `Array.from` is not faster there.
* The rule of ADR 0036 now covers a `Map` with the built-in iterator, and a getter, like a method, is called from its prototype. ADR 0036 is otherwise unchanged.
* In the benchmarks, against `main`: `count()` about 1,230× faster on 100,000 numbers, about 13,800× on a `Set` and 23,200× on a `Map`; `intersect` and `except` from 87% to 135% faster with a `Set` as `other`, and from 4% to 11% with an array.

### Positive Consequences

* `count()` on an array, a `Set` or a `Map` is constant time, as `length` and `size`
* `intersect` and `except` with a `Set` as `other` take about half the time
* `distinct` keeps its guarantee on every source

### Negative Consequences

* `count()` has three more branches, and the `OtherKeysIterator` one more, each with its tests
* The gain with an array as `other` is small, and the one of `distinct` on a `Set` is left
* `count(predicate)`, the other Actions on a `Set` or a `Map`, and `union`, keep reading through the iterator

## Pros and Cons of the Options

### A: `count()` and the copy of `other`

* Good, because both give the result of the iteration, `other` included
* Good, because `count()` changes complexity
* Bad, because each shortcut is one more branch to test

### B: A, and `distinct` on a `Set`

* Good, because `distinct` on a `Set` is about 11× faster
* Bad, because a `Set` changed while it is read yields a value twice, which `distinct` promises never to do
* Bad, because `distinct` directly on a `Set` removes nothing, so the case is rare

### C: the `Set` constructor on every `other`

* Good, because one branch covers every `other` without a key selector
* Bad, because on a generator or an iterator object the constructor is up to 16% slower than the loop

### D: no shortcut

* Good, because no operation gains a branch
* Bad, because `count()` reads a whole `Set` or `Map` to return its `size`
