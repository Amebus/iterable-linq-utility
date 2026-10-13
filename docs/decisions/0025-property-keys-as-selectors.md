# Property keys as selectors

* Status: accepted
* Deciders: Amebus
* Date: 2026-10-13

Technical Story: https://github.com/Amebus/iterable-linq-utility/issues/185

## Context and Problem Statement

On an iterable of objects, most selectors only read a property: `collectToMap(o => o.id)`, `sum(o => o.price)`, `groupBy(o => o.team)`. `min` and `max` already accept a property key in place of the function: a `Comparer<T>` can be a key, compared with `<`. The other operations that take a selector do not.

A key is shorter to write, and it says that the selector only reads a property. But a second form of the same argument doubles the overloads, the validation, the tests and the documentation, and it may slow down the form that exists today: in #152 and #177, a call through a variable that sees two different functions was 2 to 4 times slower than the same code written inline.

Should a selector also accept a property key, and how?

## Decision Drivers

* `key` gives the same result as `v => v[key]`, and fails in the same way
* No slower than the lambda, and the lambda no slower than before
* The result type follows the key: `map('name')` is an `Iterable<T['name']>`
* One rule for every operation, so a new one applies it instead of choosing again

## Considered Options

* A: no property keys: the selectors stay functions
* B: a property key, resolved once into the function `v => v[key]`
* C: a property key, read inline in a dedicated iterator or loop

## Decision Outcome

Chosen option: "C: a property key, read inline in a dedicated iterator or loop". The choice between B and C was made by measuring both on `map`, `sum`, `groupBy` and `distinct`, outside Vitest, against `main`. The gate was that the key is no slower than the lambda, and the lambda no slower than on `main`.

* **The rule.** A selector that reads a value from the element also accepts a property key: a `string`, a `symbol` or a `number`.
  * The operations covered are `collectToMap` (key and value), `distinct`, `except`, `intersect`, `union`, `flatMap`, `groupBy`, `groupJoin` and `innerJoin` (both keys), `map`, `sum` and `average`.
  * `key` behaves like `v => v[key]`. It reads the prototype chain and the getters, it does not receive the index, and the keys keep their equality ([ADR 0024](0024-equality-of-the-operations-that-compare-values.md)).
  * A value that is `null` or `undefined` throws the native `TypeError`, which propagates unchanged and closes the source, like the error of a callback ([ADR 0008](0008-error-handling-and-source-closing.md)).
* **Where it does not apply.** Predicates (`filter`, `some`, `every`, `find…`, `count`, `takeWhile`, `skipWhile`, `single`), reducers, taps, `forEach`, the `equals` of `sequenceEqual` and the `result` of the joins. They compute or decide; they do not read a value. `min` and `max` keep `Comparer<T>`, where a key orders the values with `<`.
* **Typing.**
  * There is one more overload per selector, after the function one: `P extends keyof T`, with the result typed from `T[P]`.
  * `sum` and `average` accept only the keys whose value is a `number`, and `flatMap` only those whose value is an `Iterable`. Both use `KeysOfType<T, V>`, which is exported and leaves out the optional properties. On a tuple its keys are the indices: `sum(map.entries(), 1)`.
  * The joins and `collectToMap` get every combination of function and key. The two keys of a join need values in common, in either direction, as two functions would: `KeysOverlapping<T, V>`, exported too, keeps an optional foreign key (`customerId?: number`) and matches `string` with `'a' | 'b'`.
  * Primitive element types are allowed, as `v[key]` is (`map('length')` on strings, `map(0)` on tuples).
* **Validation.** `Validations.throwIfNotSelector` accepts a function or a property key. Anything else is rejected when the operation is called, with `The "<name>" must be a function or a property key` ([ADR 0020](0020-error-messages-of-the-library.md)).
* **Implementation.** After the validation, `isPropertyKey(selector)` chooses the code. The key is read inline with one of three patterns, and the function form keeps its code, or code measured as fast as before:
  * an iterator class for the key, when the iterator has no branch to reuse: `map`, `groupBy`, `distinct`, and `flatMap`, whose states and steps move to an abstract base class with one subclass for the mapper and one for the key;
  * a field for the key, read in the branch that the iterator already has for a missing selector: `except`, `intersect`, `union`;
  * a field for the function and a field for the property, with a check before the read, when a selector is never missing: the keys of `innerJoin` and `groupJoin`.

  An Action calls a function for the key, and the loop of the selector also gets its own function: `sum`, `average`, and `collectToMap`, whose two mixed forms (a key and a function) share one loop. The `try`/`catch` around the read and `closeAfterCallbackError()` are the same as for a callback.
* **Compatibility.** An options object after the selectors (#167) is not a property key, so the overloads stay unambiguous. A data-last form (#114) can tell `map('name')`, one argument, from `map(iterable, 'name')`.

### Positive Consequences

* `sum('price')` and `groupBy('team')` are shorter than the lambda, and typed from the property.
* The key is as fast as the lambda or faster.
  * Outside Vitest, it measured −7% on `map` and −8…−19% on `sum`, and was within the noise on `groupBy` and `distinct`.
  * In Vitest, where the lambdas of the benches share one call site, it was up to 4.5 times faster on `sum`.
* The lambda keeps the speed it has on `main`. `sum` measured 1.262 against 1.263 ns per value; `groupBy` and `distinct` stayed within the noise.

### Negative Consequences

* Every operation covered has two code paths, so the specs and the benches cover both: a property key equals the lambda, a `null` value closes the source, and a `property` (or `key`) bench case stands next to the lambda one. The three patterns of the implementation are one more thing to choose from when adding an operation, and a change to the function form must be measured again.
* An Action has to keep each loop in a function of its own. A `return` before the loop, in the same function, slowed the loop of `sum` by 14%, with the same code in the loop.
* The overloads multiply: `collectToMap` has six signatures, `innerJoin` and `groupJoin` four each, on the raw function and on the chain.
* The validation message of these operations changes, from `The "<name>" function must be provided`.
* The measures of `groupBy` and `distinct` have a noise of ±10%: a difference smaller than that cannot be excluded, although the code of their function form is unchanged.

## Pros and Cons of the Options

### A: no property keys

* Good, because there is nothing to add, test or document
* Bad, because the most frequent selector, a property read, stays a lambda, and `min`/`max` remain the only operations with keys

### B: resolve the key into `v => v[key]`

* Good, because there is one code path: the iterators and the loops do not change, as `toCompareFunction` does for `min` and `max`
* Bad, because the key was 2–10% slower than the lambda on `map`, `groupBy` and `distinct`
* Bad, because when both forms reach the same call site, `sum` with a lambda became 2.5 times slower: the polymorphic call of #152

### C: read the key inline

* Good, because the key is as fast as the lambda or faster, and the lambda keeps its speed
* Bad, because each operation has a second iterator or loop, and an Action must keep its loops in separate functions
