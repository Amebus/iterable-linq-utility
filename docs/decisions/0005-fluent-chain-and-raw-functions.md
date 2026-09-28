# Fluent chain and raw functions

* Status: accepted
* Deciders: Amebus
* Date: 2026-09-28

The two APIs exist since the first versions of the library; the decision is recorded here for release 0.1.0.

## Context and Problem Statement

JavaScript has no extension methods, so a fluent chain needs a wrapper object around the `Iterable`. A wrapper is convenient to read, but it cannot be tree-shaken and it does not compose with plain functions or with other libraries.

Should the library offer the fluent chain, plain functions over `Iterable`, or both?

## Decision Drivers

* Readable, discoverable chains (`from(x).filter(f).map(g)`)
* Operations usable on any `Iterable`, without a wrapper, and composable with other libraries
* One implementation of each operation, so the two forms cannot behave differently

## Considered Options

* A: only the fluent chain
* B: only plain functions
* C: both, with the chain delegating to the functions

## Decision Outcome

Chosen option: "C: both, with the chain delegating to the functions".

* Each operation is a plain function in `src/functions/`, exported as the `Functions` namespace. It takes the `Iterable` as its first argument and returns an `Iterable` or a result.
* Each chain method calls the matching function: a transformation returns `toChain(fn(this.iterable, …))`, an action returns `fn(this.iterable, …)`.
* The validation, the laziness and the error handling live only in the functions.

### Positive Consequences

* One implementation, tested once; the chain tests only check the delegation
* The raw functions work on any `Iterable`, including the output of other libraries
* Adding an operation follows one recipe (see the contribution guide)

### Negative Consequences

* Every operation is declared twice: on the function and on `IIterableLinqBase`, each with its own JSDoc
* The documentation shows two examples per operation
* The chain adds one allocation per transformation (the wrapper)

## Pros and Cons of the Options

### A: only the fluent chain

* Good, because there is one API to learn
* Bad, because every use needs a wrapper, even for one operation

### B: only plain functions

* Good, because it is the smallest API and composes well
* Bad, because nested calls read inside out: `map(filter(x, f), g)`

### C: both

* Good, because each user picks the form that fits
* Bad, because the public surface is twice as large
