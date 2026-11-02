# The validation messages name the argument

* Status: accepted
* Deciders: Amebus
* Date: 2026-11-02

Technical Story: https://github.com/Amebus/iterable-linq-utility/issues/202

Amends: [ADR 0020](0020-error-messages-of-the-library.md)

## Context and Problem Statement

[ADR 0020](0020-error-messages-of-the-library.md) gave every error of the library the prefix `[iterable-linq-utility/<operation>]`, and every `Validations` helper the name of the operation. Most helpers take the name of the argument too, so `filter(undefined)` says `The "predicate" function must be provided`. `throwIfNotIterable` did not: it always wrote `"sourceIterable"`, a name that no signature uses, also when the invalid argument was the `other` of `except`, the `inner` of `innerJoin` or an element of the `others` of `concat`. An audit of every operation (#202) also found arguments that were not validated at all: the `comparer` of `min` and `max`, the options of `memoize`, the bounds of `range`, the `separator` of `join`.

How does a validation message say which argument is wrong?

## Decision Drivers

* The message points to the argument the caller wrote, by the name the signature and the JSDoc give it
* One rule for every helper, with no exception to remember
* Every argument is validated when it is given
* A message changes rarely: each change is breaking for the code that matches it

## Considered Options

* A: every helper takes the name of the argument as written in the signature, `throwIfNotIterable` included
* B: keep `"sourceIterable"` for the source, and name only the other iterables
* C: nothing: the operation in the prefix is enough

## Decision Outcome

Chosen option: "A: every helper takes the name of the argument".

* Every `Validations` helper takes the value, the name of the argument as written in the signature and the JSDoc, and the operation: `throwIfNotIterable(iterable, 'iterable', 'filter')`. The source is `"iterable"`; the other iterables are `"other"`, `"inner"` and `"others"`.
* Every argument that is given is validated, with a helper of `Validations`; `throwIfNotNumber` and `throwIfNotString` join the others. An argument that takes any value (`append`, `includes`, …) needs none.
* The rest of ADR 0020 holds: the prefix, the operation, the errors of the source and of the callbacks unchanged, the specs checking the full message.
* The messages of 0.12.0 that change, and the arguments now rejected, are in [Migrating to 0.13.0](https://amebus.github.io/iterable-linq-utility/0.13/migrating-to-0.13.0/).

### Positive Consequences

* A message says which argument to fix, also when an operation takes several iterables
* The same rule for every helper, and every argument checked

### Negative Consequences

* Every message about an iterable changes, and some calls that worked now throw: a breaking change, before 1.0 a `minor`
* Every call of `throwIfNotIterable` passes one more argument

## Pros and Cons of the Options

### A: the name of every argument

* Good, because the message matches the signature and the JSDoc
* Bad, because every message about an iterable changes

### B: only the other iterables

* Good, because the most common message, the missing source, does not change
* Bad, because the source keeps a name that no signature uses, and one helper keeps a rule of its own

### C: nothing

* Good, because nothing changes
* Bad, because `concat([1], [2], 3)` says that the "sourceIterable" is wrong, while the source is fine
