# Re-runnable deferred chains

* Status: accepted
* Deciders: Amebus
* Date: 2026-09-28

The decision goes back to the first versions of the library (see the "Main Idea" in the README); it is recorded here for release 0.1.0.

## Context and Problem Statement

A chain such as `from(source).filter(f).map(g)` can run in several ways. JavaScript iterators are single-use: once consumed, they yield nothing. Arrays are eager: each step builds a new array. .NET LINQ is deferred and repeatable: a query does nothing until it is enumerated, and it can be enumerated again.

What should happen when a chain is built, and when an action runs it more than once?

## Decision Drivers

* No work, and no intermediate arrays, until a result is needed
* A chain can be stored in a variable and used by several actions (`chain.min()`, then `chain.max()`)
* Infinite sources and early exits (`some`) must work
* Caching must be visible, because it costs memory and hides changes of the source

## Considered Options

* A: eager, like the array methods
* B: deferred and single-use, like iterators and the native Iterator Helpers
* C: deferred and re-runnable, like LINQ, with caching on request

## Decision Outcome

Chosen option: "C: deferred and re-runnable, like LINQ, with caching on request".

* Transformations only describe the work. Each one returns an `Iterable` whose `[Symbol.iterator]()` creates a new iterator (`DeferredIterable`).
* Every action runs the whole chain again, from the source.
* `memoize` (lazy, optionally partial) and `materialize` (eager) store the values when running the chain twice would be too expensive, or when the source can be read only once.

### Positive Consequences

* Building a chain is cheap, and nothing runs until an action does
* A chain is a value that can be stored, passed around and run many times
* Laziness makes infinite sources and early exits possible

### Negative Consequences

* Running a chain twice runs the callbacks twice: side effects repeat, and an expensive chain costs twice
* A single-use source (a generator object) gives values only the first time; the user must `memoize` or `materialize` it
* Each run allocates new iterators

## Pros and Cons of the Options

### A: eager

* Good, because the results are plain arrays, easy to debug
* Bad, because every step allocates an intermediate array
* Bad, because infinite sources and early exits are impossible

### B: deferred and single-use

* Good, because it matches the iterator protocol and the native Iterator Helpers
* Bad, because a stored chain works only once, and the second action silently gets nothing

### C: deferred and re-runnable

* Good, because it combines laziness with chains that can be reused
* Good, because caching is explicit and chosen per chain
* Bad, because repeated runs repeat the work and the side effects
