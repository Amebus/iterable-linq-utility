# Arrays of keys are not selectors

* Status: accepted
* Deciders: Amebus
* Date: 2026-10-15

Technical Story: https://github.com/Amebus/iterable-linq-utility/issues/186, https://github.com/Amebus/iterable-linq-utility/issues/187

Amends: [ADR 0025](0025-property-keys-as-selectors.md)

## Context and Problem Statement

[ADR 0025](0025-property-keys-as-selectors.md) lets a selector be one property key: `groupBy('team')` behaves like `groupBy(v => v.team)`. An array of keys in the same place could mean three different things:

* a path: `['address', 'city']` reads `v.address.city`, as lodash `_.get` does;
* a composite key: `['lastName', 'firstName']` uses the pair of values as the key;
* for `map`, a projection: `map(['id', 'name'])` yields `Pick<T, 'id' | 'name'>`, as lodash `_.pick` does.

`Comparer<T>` already gives an array one meaning, a list of keys where the next one breaks the ties of `min` and `max`. None of the three forms came from a real use case: they came up while working on #185.

Should a selector also accept an array of keys, and with which meaning?

## Decision Drivers

* The rules of ADR 0025 still hold: the shorthand gives the same result as a function, and it is no slower than one
* An array has one meaning in the library
* The keys keep their equality ([ADR 0024](0024-equality-of-the-operations-that-compare-values.md))
* No feature without a use case to guide its details

## Considered Options

* A: no arrays: a selector is a function or one property key
* B: an array is a path
* C: an array is a composite key
* D: `map` with an array picks a subset of the properties, or a `pick` operation does

## Decision Outcome

Chosen option: "A: no arrays: a selector is a function or one property key".

* A selector accepts a function or one property key. A nested property or a composite key is written as a function: `groupBy(o => o.address.city)`.
* `Validations.throwIfNotSelector` already rejects an array, with `The "<name>" must be a function or a property key`. Its specs fix that behaviour.
* A composite key written as a function, `v => [v.lastName, v.firstName]`, is compared by reference, as every other object is ([ADR 0024](0024-equality-of-the-operations-that-compare-values.md)), so each element is a different key. Comparing composite keys by their values is a decision about equality, not about the shorthand, and it gets its own issue when a real case appears.
* There is no `pick` operation: `map(v => ({ id: v.id, name: v.name }))` is typed and creates a new object. A real case can propose it as a new operation.

### Positive Consequences

* Nothing to add, type, test, measure or document, and no second meaning for an array next to `Comparer<T>`
* The function form stays the only form for anything beyond one property, with the speed it has today

### Negative Consequences

* A nested property, a composite key and a projection stay lambdas, longer to write than a shorthand
* Composite keys compared by value are still not possible without building the key by hand, for example a string

## Pros and Cons of the Options

### A: no arrays

* Good, because nothing changes and the rule of ADR 0025 stays one key
* Good, because an array keeps the meaning that `Comparer<T>` gives it
* Bad, because the shorthand does not cover nested properties, composite keys or projections

### B: an array is a path

* Good, because `groupBy(['address', 'city'])` is shorter than the lambda
* Bad, because reading the path is a loop on its segments for each element, slower than the lambda against the driver of ADR 0025
* Bad, because typing it needs recursive types (`T['address']['city']`, the valid paths of `T`), heavy for the compiler and for the error messages
* Bad, because the same array would be a path in a selector and a list of keys in a `Comparer<T>`

### C: an array is a composite key

* Good, because it is the meaning `Comparer<T>` already gives an array
* Bad, because an array cannot be a key of a `Map` or a `Set`: the key has to be encoded, as a string with the risk of collisions and with `SameValueZero` lost, or as nested `Map`s, which changes the equality of `groupBy`, `distinct`, the joins and the set operations (ADR 0024)
* Bad, because the shorthand would do something the function cannot, against the rule that `key` behaves like `v => v[key]`

### D: pick a subset of the properties

* Good, because `map(['id', 'name'])` or `pick('id', 'name')` is typed `Pick<T, K>` and shorter than the lambda
* Bad, because in `map` an array would change what the argument means, against option A
* Bad, because a `pick` operation is a new operation to specify, test, measure and document, with open questions (missing properties, inherited ones, symbols) and no case to answer them
