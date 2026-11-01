# Architecture

How the parts of the library fit together, from a call of the user to the values. What holds today is summarised in [Current decisions](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/README.md#current-decisions); the reasons are in the ADRs it links.

## The parts

| Part | Where | Role |
| --- | --- | --- |
| Entry point | `src/index.ts` | Exports the starters (`from`, `fromObject`, `fromRange`, `repeat`, `empty`), `Functions`, the extension API and the types. |
| Chain | `src/linqIterable.ts` | `IterableLinqWrapper`, created only by `toChain`. Each method delegates to the raw function of the same name ([ADR 0005](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0005-fluent-chain-and-raw-functions.md)). |
| Raw functions | `src/functions/` | One file per operation, exported as `Functions`. They validate the arguments, then do the work. |
| Iterators | `src/iterators/` | `DeferredIterable`, `BaseIterator`, `SourceIterator`, and the base classes shared by a few operations. |
| Extension API | `src/extension.ts` | `extend`, `override` and `isIterableLinq`. |
| Utilities | `src/utils/` | `Validations`, `libraryError`, the iterator results, the comparison of `min` and `max`, the property keys of the selectors. |
| Collections | `src/collections/` | The linked list that `materialize` and `reverse` fill. |
| Types | `src/types/` | `IIterableLinqBase`, the callbacks, the options. |

## A chain, step by step

```typescript
const chain = IterableLinq.from([1, 2, 3]).map(v => v * 10);
chain.collectToArray(); // [10, 20, 30]
```

1. `from` validates the array and calls `toChain`: an `IterableLinqWrapper` over the array.
2. `.map(f)` calls `Functions.map(array, f)`. The function validates `f` and returns a `DeferredIterable` that knows how to create a `MapIterator`. Nothing is read. The method wraps it with `toChain`: a new chain, over the `DeferredIterable`.
3. `collectToArray()` is an Action: the method returns `Functions.collectToArray(deferred)`, which reads it with `for…of`. The loop asks the `DeferredIterable` for an iterator, and it creates a new `MapIterator`, which asks the array for a new iterator.
4. Each value goes through `BaseIterator.next()`, which calls `MapIterator.advance()`: it reads the next value of the array and calls `f` on it.
5. A second action repeats step 3: a new `MapIterator` over a new iterator of the array. This is why a chain is re-runnable ([ADR 0004](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0004-re-runnable-deferred-chains.md)).

A Transformation is steps 2 and 4: a `DeferredIterable` and an iterator class. An Action is step 3: a loop over the iterable it receives.

## The iterators

- `BaseIterator` keeps an explicit `done`: `next()` calls `advance()` until it returns a done result, and `return()` calls `onReturn()` once ([ADR 0007](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0007-iterator-base-classes-with-explicit-state.md)).
- `SourceIterator` adds one upstream iterator, `source`, and the `index` passed to the callbacks; its `onReturn()` closes the source.
- An iterator with more than two states keeps them in a `state` field with a transition table ([ADR 0009](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0009-transition-tables-instead-of-switch-statements.md)).
- A selector that is a property key is read inline: an iterator class of its own (`MapKeyIterator`) or a field next to the function ([ADR 0025](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0025-property-keys-as-selectors.md)).
- `InnerLookupIterator` (`innerJoin`, `groupJoin`) and `OtherKeysIterator` (`intersect`, `except`) read the other iterable into a `Map` or a `Set` before the first value, then the source lazily.

## Errors

- A raw function validates its arguments first, with `Validations`, so a wrong argument throws when the operation is called. The errors the library creates go through `libraryError` and start with `[iterable-linq-utility/<operation>]` ([ADR 0020](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0020-error-messages-of-the-library.md)).
- Only the call of the callback is in a `try`/`catch`: on an error it calls `closeAfterCallbackError()`, which closes the source, and rethrows. An error of the source propagates without closing it ([ADR 0008](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0008-error-handling-and-source-closing.md)).

## Extending the chain

The chain class is not exported. `extend` and `override` define a method on the prototype of `IterableLinqWrapper`, so every chain has it, the ones created before included. `extend` remembers the names it added, so a second `extend` of the same name replaces it, while a name of the library needs `override` ([ADR 0003](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0003-extension-api-instead-of-public-wrapper-class.md), [ADR 0023](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0023-re-registering-an-extension.md)). `isIterableLinq` checks a brand on the prototype, a symbol of the global registry (`Symbol.for`), so it recognises the chains of another copy of the library too. See [Extending the API](advanced-concepts/extending.md).

## Where to start reading

- `src/functions/map.ts`, a Transformation with a callback and a property key, and `src/functions/some.ts`, an Action that stops early.
- [Adding an operation](how-to-contribute.md#adding-an-operation), and the `operation` skill in `.agents/skills/`, which has the templates.
