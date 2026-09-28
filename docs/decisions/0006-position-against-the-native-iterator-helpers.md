# Position against the native Iterator Helpers

* Status: accepted
* Deciders: Amebus
* Date: 2026-09-28

## Context and Problem Statement

ECMAScript 2025 added the Iterator Helpers: `Iterator.from` and `map`, `filter`, `flatMap`, `take`, `drop`, `reduce`, `toArray`, `forEach`, `some`, `every` and `find` on `Iterator.prototype`. They cover part of what this library does, natively.

Should the library keep its own operations, wrap the native helpers, or step aside?

## Decision Drivers

* The library's value is the LINQ model: re-runnable chains ([ADR 0004](0004-re-runnable-deferred-chains.md)) over any `Iterable`
* Operations the helpers do not have: `min`/`max` with comparers, `memoize`, `materialize`, `repeat`, ranges, taps, `forEachAsync`, extensions
* Behaviour close to the helpers where they overlap, so users are not surprised
* Runtimes without the helpers (older browsers and Node versions)

## Considered Options

* A: deprecate the library in favour of the native helpers
* B: implement the chain on top of the native helpers
* C: keep an independent implementation that follows the helpers' semantics where they overlap

## Decision Outcome

Chosen option: "C: keep an independent implementation that follows the helpers' semantics where they overlap".

* The native helpers work on an `Iterator` and consume it once. A chain works on an `Iterable` and runs again at each action.
* Where the operations overlap, the library follows the helpers: callbacks receive the value and its index; `flatMap` reads each inner iterable completely; a throwing callback closes the source and ends the chain. The known differences are documented, for example after an error thrown by the source itself ([ADR 0008](0008-error-handling-and-source-closing.md)).

### Positive Consequences

* The library works in every runtime that supports the iterator protocol
* Its behaviour is familiar to users who know the helpers
* It is free to add operations the standard does not have

### Negative Consequences

* It reimplements operations that are now native, and must match their semantics by hand
* The native helpers can be faster, because the engine optimises them

## Pros and Cons of the Options

### A: deprecate the library

* Good, because there is nothing to maintain
* Bad, because re-runnable chains and the extra operations are lost

### B: build on the native helpers

* Good, because the overlapping operations would be native
* Bad, because the helpers consume their iterator, so every run would rebuild the helper chain
* Bad, because runtimes without the helpers would need a polyfill

### C: independent implementation

* Good, because the chain model and the runtime support stay under the library's control
* Bad, because the overlapping semantics must be kept aligned by tests
