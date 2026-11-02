# Advanced Concepts

This page goes deeper into what [Deferred Execution](../basic-concepts.md#deferred-execution) summarises in the Basic Concepts: when a chain reads its source, how much of it, and what it sees when the source changes.

## Deferred Execution

### Input iterable mutability

A chain keeps a reference to its source, never a copy, and every run asks the source for a new iterator. So each run sees the source as it is when the run starts:

```typescript
const values = [1, 2, 3];
const chain = IterableLinq.from(values).map(v => v * 10);

chain.collectToArray(); // [10, 20, 30]
values.push(4);
chain.collectToArray(); // [10, 20, 30, 40]
```

During a run, the chain sees what the iterator of the source yields. An array iterator reads by index, so a value changed or added before it is reached is seen; a `Set` yields the values added during the iteration too:

```typescript
const values = [1, 2, 3];
const seen: number[] = [];

IterableLinq.from(values).forEach(v => {
    if (v === 1) { values[2] = 30; values.push(4); }
    seen.push(v);
    return unit();
});
seen; // [1, 2, 30, 4]
```

An operation that reads the whole source before its first value ([Eager Evaluation](#eager-evaluation)) sees the source as it was at that moment: a change made later in the same run reaches only the next run.

```typescript
const values = [1, 2, 3];
const seen: number[] = [];

IterableLinq.from(values).reverse().forEach(v => {
    if (v === 3) values.push(4);
    seen.push(v);
    return unit();
});
seen;                                            // [3, 2, 1]
IterableLinq.from(values).reverse().collectToArray(); // [4, 3, 2, 1]
```

The other iterables of `except`, `intersect`, `innerJoin` and `groupJoin` are read again on every run too, so a change to them is seen by the next run.

To fix the values of a chain, store them: [materialize](../api-reference/actions.md#materialize) takes a snapshot, while [memoize](../api-reference/transformations.md#memoize) keeps the values it has read and reads the others from the source as it is when they are needed. See the caveat on [mutable sources](#repeatable-execution-caveats) and [Memoize vs Materialize](#memoize-vs-materialize).

### Fully Deferred Execution

Every [Transformation](../api-reference/transformations.md), and every function that starts a chain, reads nothing and calls no callback when it is called: it only records the work. The work happens in the iterator that each run creates (see [Architecture](../architecture.md)). So a chain over an infinite source can be built, and run as far as an action needs:

```typescript
let reads = 0;
const naturals = { *[Symbol.iterator]() { let n = 0; while (true) { reads++; yield n++; } } };

const chain = IterableLinq.from(naturals).filter(v => v % 2 === 0).map(v => v * 10);
reads;                         // 0
chain.take(3).collectToArray(); // [0, 20, 40]
reads;                         // 5
```

Only the arguments are checked at the call, so a wrong argument throws when the chain is built: see [Errors](../basic-concepts.md#errors).

When the chain runs, most transformations read one value of the source for each value they yield ([Lazy Evaluation](../glossary.md#lazy-evaluation)). A few read a bounded number of values ahead: `skip` and `skipWhile` read the values they skip, `skipLast(count)` and `with` with a negative index keep `count` values in a buffer, `chunk(size)` reads `size` values for each chunk.

### Partially Deferred Execution

[tapChainCreation](../api-reference/taps.md#tapchaincreation) is the only operation that does part of its work at the call: its callback runs at once, with the chain built so far, while the chain itself still runs only when an action asks for the values. [tapChain](../api-reference/taps.md#tapchain), instead, calls its callback at every run:

```typescript
let calls = 0;
let runs = 0;
const chain = IterableLinq
    .from([1, 2])
    .tapChainCreation(() => { calls++; return unit(); })
    .tapChain(() => { runs++; return unit(); });

calls; // 1, at the call
runs;  // 0
chain.collectToArray();
chain.collectToArray();
calls; // still 1
runs;  // 2, one per run
```

### Eager Evaluation

Lazy and eager say how much of the source an operation reads for each value it yields, not when the work starts, which is deferred for every transformation, nor whether the values are kept, which is the job of `memoize`. The words follow the [LINQ documentation](https://learn.microsoft.com/en-us/dotnet/standard/linq/deferred-execution-lazy-evaluation#eager-vs-lazy-evaluation): see [Lazy Evaluation](../glossary.md#lazy-evaluation) in the glossary.

These operations read the whole source before they yield the first value:

- [groupBy](../api-reference/transformations.md#groupby), [reverse](../api-reference/transformations.md#reverse), [sort](../api-reference/transformations.md#sort) and [takeLast](../api-reference/transformations.md#takelast);
- [slice](../api-reference/transformations.md#slice) with a negative `start`;
- [memoize](../api-reference/transformations.md#memoize) with `allowPartialMemoization: false`, which is eager and keeps the values.

[except](../api-reference/transformations.md#except), [intersect](../api-reference/transformations.md#intersect), [innerJoin](../api-reference/transformations.md#innerjoin) and [groupJoin](../api-reference/transformations.md#groupjoin) read their other iterable whole before the first value, and their source lazily.

An eager operation holds the values it reads in memory, and on an infinite source it never yields its first value:

```typescript
IterableLinq.from(naturals).take(3).collectToArray();           // [0, 1, 2]
IterableLinq.from(naturals).reverse().take(3).collectToArray(); // never returns
```

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

[memoize](../api-reference/transformations.md#memoize) puts a cache between the chain and its source. Calling it reads nothing: the cache fills while the values are read.

- **One cache, several consumers.** Every run of the chain, and every iterator over it, reads the same cache by index. A consumer reads the source only past the cached values, so every value of the source is read once, even when two consumers interleave:

    ```typescript
    let reads = 0;
    const cached = IterableLinq
        .from([1, 2, 3, 4])
        .map(v => { reads++; return v; })
        .memoize();

    const a = cached[Symbol.iterator]();
    const b = cached[Symbol.iterator]();
    a.next(); // { value: 1, done: false }, read from the source
    b.next(); // { value: 1, done: false }, read from the cache
    reads;    // 1
    ```

- **Partial or full.** With `allowPartialMemoization: true`, the default, the cache fills as far as the consumers read. With `false`, the first read reads the whole source into the cache, so an infinite source never returns:

    ```typescript
    const naturals = { *[Symbol.iterator]() { let n = 0; while (true) yield n++; } };

    IterableLinq.from(naturals).memoize().take(3).collectToArray(); // [0, 1, 2]
    IterableLinq.from(naturals).memoize({ allowPartialMemoization: false }).take(3).collectToArray(); // never returns
    ```

- **Stopping early does not close the source.** A consumer that stops early, like [some](../api-reference/actions.md#some) or [take](../api-reference/transformations.md#take), leaves the source open, so that another consumer can continue from the end of the cache. The source is released when a consumer reads it to the end. Until then it stays open: the `finally` block of a generator does not run.

    ```typescript
    let reads = 0;
    const cached = IterableLinq
        .from([1, 2, 3, 4])
        .map(v => { reads++; return v; })
        .memoize();

    cached.some(v => v === 2); // true
    reads;                     // 2
    cached.collectToArray();   // [1, 2, 3, 4]
    reads;                     // 4: only 3 and 4 were read from the source
    ```

- **Source errors are stored.** When the source throws, the error reaches the consumer that was reading. Every later read past the cached values throws the same error, without reading the source again. The values cached before the error can still be read:

    ```typescript
    const failing = { *[Symbol.iterator]() { yield 1; throw new Error('boom'); } };
    const cached = IterableLinq.from(failing).memoize();

    cached.collectToArray();         // throws Error('boom')
    cached.collectToArray();         // throws the same error, the source is not read again
    cached.take(1).collectToArray(); // [1], from the cache
    ```

- **Changing the option starts a new cache.** Calling `memoize()` on a memoized chain with the same option returns the same cache. With the other value of `allowPartialMemoization`, it returns a new memoized chain over the original source, with an empty cache: the source runs again.
- **Mutable sources.** The cache never changes once a value is in it, but a value not read yet comes from the source as it is when it is read. After the source has been read to the end, the cache ignores it:

    ```typescript
    const values = [1, 2];
    const cached = IterableLinq.from(values).memoize();

    cached.take(1).collectToArray(); // [1]
    values[1] = 20;
    values.push(3);
    cached.collectToArray();         // [1, 20, 3]: 20 and 3 were not cached yet
    values.push(4);
    cached.collectToArray();         // [1, 20, 3]: the source was read to the end
    ```

- **Memory.** The cache keeps every value read, for as long as the chain is referenced.

## Materialize in-depth

[materialize](../api-reference/actions.md#materialize) is an Action: it reads the whole source when it is called, stores the values and returns a new chain over them. The source is read to the end, so it is released at once.

- **The work runs at the call, once.** The callbacks of the chain run when `materialize` is called, and never again:

    ```typescript
    let reads = 0;
    const stored = IterableLinq
        .from([1, 2, 3])
        .map(v => { reads++; return v * 10; })
        .materialize();

    reads;                   // 3, before any read
    stored.collectToArray(); // [10, 20, 30]
    stored.collectToArray(); // [10, 20, 30]
    reads;                   // still 3
    ```

- **Errors are thrown by the call.** An error of the source or of a callback is thrown by `materialize` itself, not by the later reads: `IterableLinq.from(failing).materialize()` throws `Error('boom')`.
- **No infinite sources.** `materialize` reads the source to the end, so on an infinite source it never returns. Use [take](../api-reference/transformations.md#take) first, or `memoize`.
- **A snapshot.** The values are copied when `materialize` is called, so later changes to a mutable source are not seen:

    ```typescript
    const values = [1, 2];
    const stored = IterableLinq.from(values).materialize();

    values.push(3);
    stored.collectToArray(); // [1, 2]
    ```

- **Materializing again copies nothing.** Calling `materialize()` on a materialized chain returns a chain over the same stored values.

## Memoize vs Materialize

|                    | memoize                                            | materialize                         |
| ------------------ | -------------------------------------------------- | ----------------------------------- |
| Kind               | Transformation                                     | Action                              |
| Reads the source   | lazily, as far as the consumers read               | all of it, when called              |
| Infinite source    | yes, with partial memoization                      | no, never returns                   |
| Stopping early     | keeps the source open for the next consumer        | the source is already read          |
| Source errors      | thrown on read, then stored and thrown again       | thrown by the call                  |
| Mutable source     | sees the changes to the values not cached yet      | snapshot at the call                |

Use **memoize** when the chain may not be read to the end, when the source is infinite, or when nothing should run until the values are needed.

Use **materialize** when the work should run now, at a point where its errors are expected; when you need a snapshot of a source that changes; or when the source should be released at once.

## Extending the API

Add or replace operations on every chain with `extend` and `override`, and recognise chains with `isIterableLinq`: see [Extending the API](extending.md).
