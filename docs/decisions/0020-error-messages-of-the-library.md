# Error messages of the library

* Status: accepted
* Deciders: Amebus
* Date: 2026-10-03

Technical Story: https://github.com/Amebus/iterable-linq-utility/issues/145

## Context and Problem Statement

The errors the library creates say what is wrong, but not who threw them: `The "predicate" function must be provided`. In a long chain, or in an application with many libraries, it is not obvious that the error comes from `iterable-linq-utility`, nor from which operation. How does an error of the library say where it comes from?

## Decision Drivers

* An error of the library is recognisable at a glance, in a log or a stack trace
* It names the operation that rejected the input
* The errors of the source and of the callbacks stay unchanged ([ADR 0008](0008-error-handling-and-source-closing.md))
* No new public API to maintain

## Considered Options

* A: a `[iterable-linq-utility/<operation>]` prefix in the message, with the operation passed explicitly
* B: a dedicated error class, e.g. `IterableLinqError` with an `operation` field
* C: the operation read from the stack trace

## Decision Outcome

Chosen option: "A: a prefix in the message, with the operation passed explicitly".

* Every error the library creates is built by `libraryError(operation, message)` in `src/utils/libraryError.ts`: `[iterable-linq-utility/<operation>] <message>`, an `Error`.
* Every `Validations` helper takes the operation as its last argument, which is required: a call without it does not compile.
* `<operation>` is the function that validates the input: the raw function (`filter`, `forEachAsync`), or the exported API (`from`, `fromRange`, `extend`, `override`, `tapChainCreation`). A chain method delegates to the raw function, so `IterableLinq.from(x).filter(undefined)` reports `filter`, and `fromRange` reports `range` for an invalid `step`, which `Functions.range` validates.
* The errors of the source and of the callbacks propagate unchanged, by reference.
* The specs check the full message, prefix included.

### Positive Consequences

* The message tells where the error comes from, without a new class to export and document
* A missing operation name is a compile error, and a wrong one fails the specs

### Negative Consequences

* The messages change: code that matches them exactly breaks
* Every call of a `Validations` helper repeats the name of its operation
* The error cannot be told apart with `instanceof`: a dedicated class can be added later, in its own issue

## Pros and Cons of the Options

### A: prefix in the message

* Good, because it is visible wherever the message is printed, and adds no public API
* Bad, because the name is a string repeated at every call

### B: dedicated error class

* Good, because `instanceof` and an `operation` field are easier to handle in code than a message
* Bad, because it is a new public API to export, document and keep compatible

### C: operation from the stack trace

* Good, because no call has to pass a name
* Bad, because stack traces differ between engines and the minified bundle renames the functions
