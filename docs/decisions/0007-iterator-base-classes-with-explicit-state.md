# Iterator base classes with explicit state

* Status: accepted
* Deciders: Amebus
* Date: 2026-09-28

Technical Story: https://github.com/Amebus/iterable-linq-utility/pull/21 (design: `docs/superpowers/specs/2026-09-26-iterator-core-refactor-design.md`)

## Context and Problem Statement

Before 0.1.0, each operator implemented its iterator by swapping the function stored in a field (for example `this.internalNext = getDoneIteratorResult`) instead of keeping an explicit state. The pattern was applied differently in each file, and caused bugs:

* a missing transition went unnoticed: the `range` iterator restarted after `done`;
* only `map` forwarded `return()` to its source, so `filter`, `tap` and `flatMap` left generator sources open;
* in `LinkedList`, mixing `addFirst` and `addLast` lost nodes.

It was also slower: on `map(filter(range(2e6)))` it took 33.6 ms, against 23.0 ms for a prototype with a `done` flag. Each instance created one closure per state, and the JIT could not inline the call sites. Ten `XxxIterable` classes were almost identical.

How should the iterators of the operators be built?

## Decision Drivers

* One place owns the "done" state and `return()` for every iterator
* An operator contains only its own logic
* Closing the source is uniform, and `return(value)` reaches the original iterator
* At least as fast as before on the reference benchmark

## Considered Options

* A: keep the swapped functions, and fix each bug where it is
* B: generator functions (`function*`)
* C: small base classes with an explicit `done` flag

## Decision Outcome

Chosen option: "C: small base classes with an explicit `done` flag". The building blocks are in `src/iterators/`:

* `BaseIterator<T>` owns `done`: `next()` calls the abstract `advance()` only while the iterator is not done, and `return(value)` calls `onReturn(value)` at most once.
* `SourceIterator<S, T>` adds one upstream iterator and an `index`, and closes the upstream iterator in `onReturn`.
* `DeferredIterable<T>` creates a new iterator at each `[Symbol.iterator]()` call, which keeps chains re-runnable ([ADR 0004](0004-re-runnable-deferred-chains.md)). It replaces the ten `XxxIterable` classes.
* `unfold(seed, step)` builds the simple sources (`repeat`, `empty`). `range`, the hottest source, has a dedicated iterator.

State with more than two values is kept as data, not as swapped functions: see [ADR 0009](0009-transition-tables-instead-of-switch-statements.md).

### Positive Consequences

* "Done" is sticky for every iterator, so the `range` bug cannot come back in another operator
* `return()` closes the whole chain, and forwards its value
* `map`, `filter` and `tap` are a few lines each
* The reference benchmark went from about 30 ms to about 25 ms

### Negative Consequences

* Operators must derive from the base classes, and follow their contract (`advance`, `onReturn`)
* Protected members are part of the internal contract, so changing them touches every operator
* Handling callback errors stays in each operator: a `try/catch` in the shared `next()` was too slow ([ADR 0008](0008-error-handling-and-source-closing.md))

## Pros and Cons of the Options

### A: keep the swapped functions

* Good, because it is the smallest change
* Bad, because the state stays spread over several mutable fields, and each bug must be found separately
* Bad, because the per-instance closures keep the call sites slow

### B: generator functions

* Good, because they are short, and `finally` closes the source on `return()`
* Bad, because a generator cannot see the value passed to `return(value)`, so it cannot forward it
* Bad, because each step resumes a suspended function, which is harder for the engine to optimise than a method call

### C: base classes with a `done` flag

* Good, because the protocol rules are written once
* Good, because the methods are monomorphic and easy to inline
* Bad, because it is more code than a generator for a simple operator
