# Extension API instead of a public wrapper class

* Status: proposed
* Deciders: Amebus
* Date: 2026-09-27

## Context and Problem Statement

The library exports the class `IterableLinqWrapper`, which implements `IIterableLinq`. The class is the only way to add operators to every chain, which ADR 0001 and ADR 0002 require ("Allow for extensibility into projects using the library thanks to typescript module augmentation"). It also lets users skip the validation of `from()`, ties them to `instanceof` and to the class name, and publishes its private members in the type declarations.

How should users extend the fluent API, and should the class stay public?

## Decision Drivers

* Allow for extensibility into projects using the library thanks to typescript module augmentation
* Freedom to change the wrapper implementation (for example sync and async wrappers) without breaking users
* Validation of the input must always run
* Chains must be recognisable even with two copies of the library installed
* Release 0.1.0 is unpublished and already breaking

## Considered Options

* A: keep the class public as the documented extension point
* B: hide the class and expose `extend()` and `isIterableLinq()`
* C: keep the class exported but mark it `@internal`

## Decision Outcome

Chosen option: "B: hide the class and expose `extend()` and `isIterableLinq()`". It keeps the extensibility goal, frees the implementation, and costs the least now, because 0.1.0 is already a breaking release.

### Positive Consequences

* Chains are created only through the factories, so validation always runs
* The wrapper class can be renamed, split or regenerated without breaking users
* `extend()` rejects names that already exist, so a built-in method cannot be overwritten by mistake
* `isIterableLinq()` uses a `Symbol.for` brand and works across copies of the library

### Negative Consequences

* A new public API to maintain
* Inside an extension, `this` is `IIterableLinq<unknown>`: the element type is not available to the implementation
* Registering the same name twice throws, so extensions must be registered once, at start-up

## Pros and Cons of the Options

### A: keep the class public as the documented extension point

Add validation to the constructor and document `IterableLinqWrapper.prototype.name = …` together with module augmentation.

* Good, because no new API is needed
* Good, because extensions can type `this` with the chain's generic
* Bad, because the class name and shape become a public contract
* Bad, because a built-in method can be overwritten silently
* Bad, because hiding the class later would be a breaking change

### B: hide the class and expose `extend()` and `isIterableLinq()`

* Good, because the implementation can change freely
* Good, because the extension point is explicit and checked at runtime
* Good, because the check does not depend on `instanceof`
* Bad, because it adds an API to design, document and maintain
* Bad, because `this` inside an extension loses the element type

### C: keep the class exported but mark it `@internal`

* Good, because it needs no work
* Bad, because users can still depend on it, with no guarantees
* Bad, because it solves none of the problems above
