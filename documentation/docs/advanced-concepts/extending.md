# Extending the API

Every chain created by `from`, `fromRange`, `repeat` and `empty` is an `IIterableLinq`. The class behind it is internal: use the functions below to recognise chains and to add or replace operations.

## Recognising a chain

```typescript
import { from, isIterableLinq } from 'iterable-linq-utility';

isIterableLinq(from([1, 2, 3])); // true
isIterableLinq([1, 2, 3]);       // false
```

`isIterableLinq` checks a brand stored in the global symbol registry (`Symbol.for`), not `instanceof`, so it also works when two copies of the library are installed.

It is a brand check, not a validation: any object can carry the same `Symbol.for` key, so do not use `isIterableLinq` to decide whether untrusted input is safe to call.

## Adding an operation

Adding an operation takes two steps:

1. Declare it by augmenting the `IIterableLinq` interface. Declare it on `IIterableLinq`, not on `IIterableLinqBase`, which holds the library's own operations.
2. Register it at application start-up with `extend`.

The method is available on every chain, including chains created before the call to `extend`.

`extend` throws if:

- the name is a library operation (`map`, `filter`, …) or a member of `Object.prototype` (`toString`, `hasOwnProperty`, …);
- the name is empty;
- the implementation is not a function.

The examples below use only the public API: the building blocks of the library's own operations are internal.

### A custom Transformation

A [Transformation](../api-reference/transformations.md) returns a new chain. `pairwise` yields every value together with the next one:

```typescript
import { extend, from, type IIterableLinq } from 'iterable-linq-utility';

declare module 'iterable-linq-utility' {
    interface IIterableLinq<T> {
        pairwise(): IIterableLinq<[T, T]>;
    }
}

extend('pairwise', function () {
    const source = this;
    return from({
        *[Symbol.iterator]() {
            let previous: unknown;
            let first = true;
            for (const value of source) {
                if (!first)
                    yield [previous, value];
                previous = value;
                first = false;
            }
        }
    });
});

from([1, 2, 3]).pairwise().collectToArray(); // [[1, 2], [2, 3]]
```

Written this way, it behaves like the library's own Transformations:

- **Lazy.** Calling `pairwise()` reads nothing: the generator runs when an [Action](../api-reference/actions.md) reads the chain.
- **Re-runnable.** `from` gets an object whose `[Symbol.iterator]` calls the generator, so every run of the chain starts a new generator over the source:

    ```typescript
    const pairs = from([1, 2, 3]).pairwise(); // nothing runs yet
    pairs.collectToArray(); // [[1, 2], [2, 3]]
    pairs.collectToArray(); // [[1, 2], [2, 3]], read again from the source
    ```

    Passing `from` a generator object instead, `from((function* () { … })())`, gives the values on the first run and nothing on the next ones: see [Repeatable Execution Caveats](index.md#repeatable-execution-caveats).

- **Closes the source.** When the consumer stops early, or a callback further down the chain throws, the consumer closes the generator, and the `for…of` inside it closes the source:

    ```typescript
    from([1, 2, 3, 4]).pairwise().take(1).collectToArray(); // [[1, 2]], the source is closed after 2
    ```

### A custom Action

An [Action](../api-reference/actions.md) runs the chain when it is called and returns a value, not a chain. `partition` splits the values in two arrays, the ones that satisfy the predicate and the others:

```typescript
import { extend, from } from 'iterable-linq-utility';

declare module 'iterable-linq-utility' {
    interface IIterableLinq<T> {
        partition(predicate: (value: T, index: number) => boolean): [T[], T[]];
    }
}

extend('partition', function (predicate: (value: unknown, index: number) => boolean) {
    const matching: unknown[] = [];
    const others: unknown[] = [];
    let index = 0;
    for (const value of this)
        (predicate(value, index++) ? matching : others).push(value);
    return [matching, others];
});

from([1, 2, 3, 4, 5]).partition(v => v % 2 === 0); // [[2, 4], [1, 3, 5]]
```

Iterate the chain with `for…of` over `this`. When the Action stops early, with a `return` or a `break` inside the loop, or when the predicate throws, `for…of` closes the source, like the library's own Actions do.

### Choosing a name

Choose a name that the library does not plan to add: the planned operations are the open [`enhancement` issues](https://github.com/Amebus/iterable-linq-utility/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement). If a later release adds an operation with the same name, your `extend` call throws at start-up: see [Replacing an operation](#replacing-an-operation).

## Replacing an operation

`override` replaces an operation that already exists: a library operation or one added with `extend`.

```typescript
import { from, override } from 'iterable-linq-utility';

// a later release of the library added its own `chunk`: keep your version
override('chunk', function (size: number) { /* your implementation */ });
```

The main use of `override` is upgrading the library. If a new release adds an operation with the same name as one of your extensions, your `extend` call throws at start-up. Switch that call to `override`, or rename your operation. In the first case, keep the library's signature in your `declare module` block, because the two declarations merge into overloads of the same method.

Overriding changes only the fluent operation. The raw functions in `Functions` (for example `Functions.map`) and the library internals keep the original behaviour, so you can still call the original implementation through `Functions`.

`override` throws if:

- the name is not an operation of the chain: use `extend` to add it. This also applies to `constructor` and the members of `Object.prototype`;
- the name is empty;
- the implementation is not a function.

## Rules and limits

- **Registering again replaces.** Calling `extend` again with a name that an earlier `extend` added replaces its implementation on every chain, including the chains created before. A module that runs twice, with hot module replacement or a test runner that re-imports it, does not throw, and the chains use the edited code.
- **Name clashes are silent.** For the same reason, two packages that extend the same name overwrite each other without an error: the last one registered wins. Prefix the names of the operations you publish in a package (`myLibChunk`) to avoid it.
- **Extensions are global.** Every chain in the process gets them, and an `override` lasts for the whole process.
- **`this` has no element type.** Inside the implementation `this` is `IIterableLinq<unknown>`. Callers still get full typing from your `declare module` block (in the example, `from([1, 2]).pairwise()` is `IIterableLinq<[number, number]>`).
- **The compiler does not match the implementation with the declaration.** Keeping the implementation consistent with the declared signature is up to you.
- **Only string names.** `extend` and `override` accept string names only; symbols (for example `Symbol.iterator`) are rejected by the compiler.
- **Assignment.** Operations added with `extend` cannot be replaced by a plain assignment: use `override`. The library's own operations keep their original behaviour here too: `override` never changes whether an operation can be reassigned.
