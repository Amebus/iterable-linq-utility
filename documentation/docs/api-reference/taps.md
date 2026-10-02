# Taps

A **Tap** observes the **O~s~C** without changing its values: logging, counting, debugging. Like a [Transformation](transformations.md), it returns a new chain and runs nothing, except for `tapChainCreation`, which runs its callback immediately.

The callbacks have nothing to return, so they return [`unit()`](../basic-concepts.md#the-unit-type).

???+ summary "TLDR list of Taps"

    | Tap                                   | Brief Description                                                  | Callback runs                          |
    | ------------------------------------- | ------------------------------------------------------------------ | -------------------------------------- |
    | [tap](#tap)                           | Calls a callback on each value as it flows through the chain       | once per value, on every run           |
    | [tapChain](#tapchain)                 | Calls a callback with the upstream `Iterable` when a run starts    | once per run, before the first value   |
    | [tapChainCreation](#tapchaincreation) | Calls a callback with the chain while the chain is being built     | once, immediately                      |

## tap

Calls the callback on each value as it flows through the chain, with the value and its index. The values do not change.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';
    import { unit } from 'iterable-linq-utility';

    IterableLinq
        .from([1, 2])
        .tap(v => { console.log('read', v); return unit(); })
        .map(v => v * 10)
        .collectToArray();
    // read 1
    // read 2
    // [10, 20]
    ```
=== "Raw Function"

    ```typescript
    import { Functions, unit } from 'iterable-linq-utility';

    Array.from(Functions.tap([1, 2], v => { console.log(v); return unit(); }));
    // 1
    // 2
    // [1, 2]
    ```

Throws an `Error` if the callback is not a function.

## tapChain

Calls the callback with the upstream `Iterable` each time the chain starts a run, before the first value is read. The index is always `0`.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';
    import { unit } from 'iterable-linq-utility';

    const chain = IterableLinq
        .from([1, 2])
        .tapChain(() => { console.log('run'); return unit(); });

    chain.collectToArray(); // run
    chain.collectToArray(); // run
    ```
=== "Raw Function"

    ```typescript
    import { Functions, unit } from 'iterable-linq-utility';

    const tapped = Functions.tapChain([1, 2], () => { console.log('run'); return unit(); });
    Array.from(tapped); // run
    Array.from(tapped); // run
    ```

Throws an `Error` if the callback is not a function.

## tapChainCreation

Calls the callback once, immediately, with the chain built so far, and returns the same chain. Nothing runs. It is useful to keep a reference to an intermediate chain.

```typescript
import * as IterableLinq from 'iterable-linq-utility';
import { type IIterableLinq, unit } from 'iterable-linq-utility';

let evens: IIterableLinq<number> | undefined;

const evensByTen = IterableLinq
    .fromRange(10)
    .filter(v => v % 2 === 0)
    .tapChainCreation(chain => { evens = chain; return unit(); })
    .map(v => v * 10);

evens?.collectToArray();
// [0, 2, 4, 6, 8]
evensByTen.collectToArray();
// [0, 20, 40, 60, 80]
```

It is available only on the chain, not in `Functions`. Throws an `Error` if the callback is not a function.
