# Equality of the operations that compare values

* Status: accepted
* Deciders: Amebus
* Date: 2026-10-05

Technical Story: https://github.com/Amebus/iterable-linq-utility/issues/152

## Context and Problem Statement

Several operations compare values: `indexOf`, `lastIndexOf`, `includes`, `distinct`, `collectToSet`, `collectToMap`, `sequenceEqual`, and the planned `union`, `intersect`, `except`, `groupBy`, `innerJoin` and `groupJoin`. JavaScript has three equalities, which differ only on `NaN` and `-0`:

| Comparison | `NaN` vs `NaN` | `0` vs `-0` |
| --- | --- | --- |
| `===` | not equal | equal |
| `SameValueZero` | equal | equal |
| `Object.is` | equal | not equal |

Each operation followed its native reference, with no stated rule: `indexOf` uses `===` like `Array.prototype.indexOf`, `includes` and `distinct` use `SameValueZero` like `Array.prototype.includes` and `Set`, and `sequenceEqual`, which has no native reference, used `===`, so `from([NaN]).sequenceEqual([NaN])` was `false` and `sequenceEqual(x, x)` could be `false` on the same array.

Which equality does an operation use?

## Decision Drivers

* A user who knows the array methods gets the same results
* Every new operation applies the rule instead of choosing again
* Two sequences of the same values are equal
* As few rules as possible

## Considered Options

* A: an operation with a native counterpart follows it; every other one uses `SameValueZero`
* B: `SameValueZero` everywhere, `indexOf` and `lastIndexOf` included
* C: `===` everywhere it can be written by hand, `SameValueZero` only where `Set` and `Map` impose it

## Decision Outcome

Chosen option: "A: an operation with a native counterpart follows it; every other one uses `SameValueZero`".

* `indexOf` and `lastIndexOf` use `===`, like `Array.prototype.indexOf` and `lastIndexOf`; `includes` uses `SameValueZero`, like `Array.prototype.includes`.
* Every other operation uses `SameValueZero`, the equality of `Set` and `Map`: `distinct`, `collectToSet`, `collectToMap`, `sequenceEqual`, and the planned set operations, groupings and joins.
* `Object.is` is never a default. A different equality is a callback: `equals` for `sequenceEqual`, a key selector for the operations that compare keys.
* `sequenceEqual` changes its default from `===` to `SameValueZero`, written inline as `a === b || (a !== a && b !== b)`; before 1.0 it is a `minor` with a section in the migration guide.
* The JSDoc and the API reference of each operation that compares values state its equality.

`SameValueZero` is also what LINQ's `EqualityComparer<T>.Default` does on numbers: `double.NaN.Equals(double.NaN)` and `0.0.Equals(-0.0)` are both `true`.

### Positive Consequences

* The operations with a native counterpart behave like it, so no surprise for array users
* The operations built on `Set` and `Map` need no extra code, and the others match them
* `sequenceEqual` says that `[NaN]` equals `[NaN]`

### Negative Consequences

* Two rules remain: `indexOf(NaN)` is `-1` while `includes(NaN)` is `true`, exactly as with arrays
* Changing the default of `sequenceEqual` is a breaking change for chains that compare `NaN`
* The `SameValueZero` default of `sequenceEqual` is one more comparison than `===` when two values differ

## Pros and Cons of the Options

### A: native counterpart first, then `SameValueZero`

* Good, because the array methods and their counterparts give the same results
* Good, because the operations without a counterpart share the rule of `Set` and `Map`
* Bad, because the library has two rules

### B: `SameValueZero` everywhere

* Good, because there is one rule
* Bad, because `indexOf` and `lastIndexOf` would give results different from the array methods of the same name
* Bad, because it is a breaking change for `indexOf` and `lastIndexOf` too

### C: `===` where possible

* Good, because `===` is the cheapest comparison
* Bad, because the operations built on `Set` and `Map` cannot use it, so the rule would depend on the implementation
* Bad, because `[NaN]` would still differ from `[NaN]`
