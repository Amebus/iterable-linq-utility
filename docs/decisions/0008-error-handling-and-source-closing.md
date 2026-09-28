# Error handling and source closing

* Status: accepted
* Deciders: Amebus
* Date: 2026-09-28

Technical Story: https://github.com/Amebus/iterable-linq-utility/pull/21

## Context and Problem Statement

A chain holds its source open while it runs: a generator with a `finally`, a file reader, a database cursor. When the chain stops early, the source must be closed with `return()`. The consumer (`for…of`, an action) does that when *it* stops. But when a callback of an operation throws, the error comes out of `next()`, and consumers do not close an iterator whose `next()` threw.

Before 0.1.0, a throwing `map`/`filter`/`tap`/`flatMap` callback left the source open, and a later `next()` resumed from the following value. The ECMAScript Iterator Helpers instead close the source when a callback throws, and the helper is done afterwards.

What should happen when a callback, or the source itself, throws?

## Decision Drivers

* A source must never be left open by the library
* Behaviour close to the native Iterator Helpers ([ADR 0006](0006-position-against-the-native-iterator-helpers.md))
* No cost on the hot path of chains that do not throw

## Considered Options

* A: no handling: the error propagates and the source stays open
* B: a `try/catch` in the shared `BaseIterator.next()`, around every read
* C: a `try/catch` only around the callback call, in each operator

## Decision Outcome

Chosen option: "C: a `try/catch` only around the callback call, in each operator".

* When the callback of `map`, `filter`, `tap` or `flatMap` throws, the operator calls `closeAfterCallbackError()`: the iterator becomes done and the source is closed, then the error propagates.
* If closing the source throws too, the callback error wins, as in the Iterator Helpers.
* In `flatMap`, an error from an inner iterable closes the outer source; the inner iterator is not closed, because it already failed.
* An error thrown by the source itself propagates without closing it (it already failed), and the chain is **not** marked done: a later `next()` asks the source again. Here the library differs from the Iterator Helpers.
* Actions (`some`, `forEach`, `reduce`, …) use `for…of`, which closes the source when they stop early or their callback throws.

### Positive Consequences

* Sources are closed on every callback error
* No measurable cost: the `try` wraps only the callback, off the shared path
* The behaviour matches the Iterator Helpers except in one documented case, pinned by `test/functions/callbackErrors.spec.ts`

### Negative Consequences

* After an error thrown by the source, the chain asks the source again on the next `next()`. A well-behaved source (a generator) is done after throwing, so this matters only for hand-written iterators
* Each operator repeats the same `try/catch` pattern, and a new operator must remember it (the contribution guide says so)

## Pros and Cons of the Options

### A: no handling

* Good, because it costs nothing
* Bad, because a callback error leaks the source

### B: `try/catch` in `BaseIterator.next()`

* Good, because it is written once and also marks the chain done after a source error, exactly like the Iterator Helpers
* Bad, because it slowed `map(filter(range))` by 45% (1.71 ms to 2.47 ms on 100,000 values): `next()` is shared by every operator, and the `try` blocks its optimisation in polymorphic chains

### C: `try/catch` around the callback only

* Good, because it closes the source on every callback error with no measurable cost
* Bad, because it does not mark the chain done after a source error
