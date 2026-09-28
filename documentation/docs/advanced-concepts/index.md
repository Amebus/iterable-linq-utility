# Advanced Concepts

!!! danger "WIP"
    Most sections of this page are still to be written. For the basics see [Deferred Execution](../basic-concepts.md#deferred-execution) and the [Glossary](../glossary.md).

## Deferred Execution

### Input iterable mutability

### Fully Deferred Execution

### Partially Deferred Execution

### Eager Evaluation

## Repeatable Execution

Every [Action](../api-reference/actions.md) runs the chain again, from the source. A chain is re-runnable only if its source is.

### Repeatable Execution Caveats

- **Single-use sources.** A generator object, or any iterator that returns itself from `[Symbol.iterator]()`, can be read only once. A chain over it gives the values on the first run and nothing on the next ones:

    ```typescript
    function* numbers() { yield 1; yield 2; }

    const chain = IterableLinq.from(numbers());
    chain.collectToArray(); // [1, 2]
    chain.collectToArray(); // []
    ```

    Add [memoize](../api-reference/transformations.md#memoize) to cache the values on the first run, or pass a re-runnable source, for example an object whose `[Symbol.iterator]` calls the generator function:

    ```typescript
    IterableLinq.from(numbers()).memoize();                   // re-runnable, from the cache
    IterableLinq.from({ [Symbol.iterator]: numbers });        // re-runnable, calls numbers() on every run
    ```

- **Mutable sources.** The chain does not copy its source. If the source changes between two runs, the second run sees the new values.
- **Side effects run again.** Callbacks passed to transformations and taps run on every run of the chain. Use [materialize](../api-reference/actions.md#materialize) or [memoize](../api-reference/transformations.md#memoize) when a callback is expensive or must run once.
- **Closing the source.** Actions that stop early, like [some](../api-reference/actions.md#some), close the source (they call its `return()` method), as a `for…of` loop does. When the callback of `map`, `filter`, `flatMap` or `tap` throws, the chain closes the source too, and every later read of that iteration is done. An error thrown by the source itself does not close it: the source has already failed.

## Memoize in-depth

## Materialize in-depth

## Memoize vs Materialize

## Extending the API

Add or replace operations on every chain with `extend` and `override`, and recognise chains with `isIterableLinq`: see [Extending the API](extending.md).
