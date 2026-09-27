# Actions

An **Action** runs the **O~s~C** and returns a result. Every call to an action runs the whole chain again, from the source.

???+ summary "TLDR list of Actions"
    | Action                            | Brief Description                                                                     | Returns                     |
    | --------------------------------- | ------------------------------------------------------------------------------------- | --------------------------- |
    | [collectToArray](#collecttoarray) | Collects the values into an `Array`                                                   | `T[]`                       |
    | [forEach](#foreach)               | Calls a callback on each value                                                        | `Unit`                      |
    | [forEachAsync](#foreachasync)     | Calls an async callback on each value, one after the other                            | `Promise<Unit>`             |
    | [materialize](#materialize)       | Runs the chain now and stores its values in a new chain                               | `IIterableLinq<T>`          |
    | [max](#max)                       | Returns the greatest value                                                            | `T \| undefined`            |
    | [min](#min)                       | Returns the smallest value                                                            | `T \| undefined`            |
    | [reduce](#reduce)                 | Accumulates the values into a single result                                           | `R`                         |
    | [some](#some)                     | Tells whether at least one value satisfies a predicate                                | `boolean`                   |

## collectToArray

Collects the values of the chain into an `Array`, in order.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .from([1, 2, 3, 4])
        .collectToArray();
    // [1, 2, 3, 4]
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Functions.collectToArray(new Set([1, 2, 3, 4]));
    // [1, 2, 3, 4]
    ```

## forEach

Calls the callback on each value, with the value and its index. The callback returns [`unit()`](../basic-concepts.md#the-unit-type). If the callback throws, the source is closed and the error propagates.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';
    import { unit } from 'iterable-linq-utility';

    IterableLinq
        .from([1, 2, 3, 4])
        .forEach(v => {
            console.log(v);
            return unit();
        });
    // 1
    // 2
    // 3
    // 4
    ```
=== "Raw Function"

    ```typescript
    import { Functions, unit } from 'iterable-linq-utility';

    Functions.forEach([1, 2, 3, 4], v => {
        console.log(v);
        return unit();
    });
    // 1
    // 2
    // 3
    // 4
    ```

Throws an `Error` if the callback is not a function.

## forEachAsync

Calls the async callback on each value, with the value and its index. The callback returns a promise of [`unit()`](../basic-concepts.md#the-unit-type).

The callbacks run **sequentially**: `forEachAsync` waits for the callback on the current value to settle before it starts the callback on the next value. The first rejection stops the iteration, closes the source and rejects the returned promise. It works on infinite sources.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';
    import { unit } from 'iterable-linq-utility';

    await IterableLinq
        .from(['a.txt', 'b.txt'])
        .forEachAsync(async file => {
            await upload(file); // 'b.txt' starts after 'a.txt' has finished
            return unit();
        });
    ```
=== "Raw Function"

    ```typescript
    import { Functions, unit } from 'iterable-linq-utility';

    await Functions.forEachAsync(['a.txt', 'b.txt'], async file => {
        await upload(file);
        return unit();
    });
    ```

!!! tip "Running the callbacks in parallel"
    To start every callback at once, map the values to promises and wait for all of them:
    ```typescript
    await Promise.all(IterableLinq.from(files).map(upload));
    ```

If the callback is not a function, the returned promise is rejected with an `Error`.

## materialize

Runs the chain immediately and stores its values, so later chains start from the stored values instead of running the source again. It is an **Action** even if it returns an `IIterableLinq`: the returned chain starts a brand new **O~s~C** over the stored values.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    const stored = IterableLinq
        .from([1, 2, 3, 4])
        .map(v => v * 10)
        .materialize(); // the map runs now

    stored.collectToArray();
    // [10, 20, 30, 40], the map does not run again
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    const stored = Functions.materialize(Functions.map([1, 2, 3, 4], v => v * 10));
    Array.from(stored);
    // [10, 20, 30, 40]
    ```

Materializing a materialized chain does not copy the values again. To store the values lazily, the first time they are read, use [memoize](transformations.md#memoize).

## max

Returns the greatest value, or `undefined` when the chain is empty. Among equal values the first one wins; `null` and `undefined` values never win against a defined one.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .from([1, 2, 3, 4])
        .max();
    // 4
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Functions.max([1, 2, 3, 4]);
    // 4
    ```

By default the values are compared with `<`. A comparer changes how they are compared. It can be:

1. The name of a property, or a list of names. With a list, ties on the first property are broken by the next one, and so on. The result is the whole value, not the property.

    === "Wrapper"

        ```typescript
        import * as IterableLinq from 'iterable-linq-utility';

        IterableLinq
            .from([{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }])
            .max('value');
        // { value: 4 }
        ```
    === "Raw Function"

        ```typescript
        import { Functions } from 'iterable-linq-utility';

        Functions.max([{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }], 'value');
        // { value: 4 }
        ```

2. A function `(a: T, b: T) => number` that returns:
    * a negative number if `a` is smaller than `b`;
    * `0` if `a` is equal to `b`;
    * a positive number if `a` is greater than `b`.

    === "Wrapper"

        ```typescript
        import * as IterableLinq from 'iterable-linq-utility';

        IterableLinq
            .from(['kiwi', 'banana', 'fig'])
            .max((a, b) => a.length - b.length);
        // 'banana'
        ```
    === "Raw Function"

        ```typescript
        import { Functions } from 'iterable-linq-utility';

        Functions.max(['kiwi', 'banana', 'fig'], (a, b) => a.length - b.length);
        // 'banana'
        ```

## min

Returns the smallest value, or `undefined` when the chain is empty. Among equal values the first one wins; `null` and `undefined` values never win against a defined one.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .from([1, 2, 3, 4])
        .min();
    // 1
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Functions.min([1, 2, 3, 4]);
    // 1
    ```

`min` accepts the same comparers as [max](#max):

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .from([{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }])
        .min('value');
    // { value: 1 }

    IterableLinq
        .from(['kiwi', 'banana', 'fig'])
        .min((a, b) => a.length - b.length);
    // 'fig'
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Functions.min([{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }], 'value');
    // { value: 1 }
    ```

## reduce

Accumulates the values into a single result. The reducer is called with the accumulator, each value and its index, and returns the new accumulator. The first argument of `reduce` is the initial accumulator (the seed); it is also the result when the chain is empty.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .from([1, 2, 3])
        .reduce(0, (acc, v) => acc + v);
    // 6

    IterableLinq
        .from(['a', 'b'])
        .reduce({} as Record<string, number>, (acc, v, index) => ({ ...acc, [v]: index }));
    // { a: 0, b: 1 }
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Functions.reduce([1, 2, 3], 0, (acc, v) => acc + v);
    // 6
    ```

Throws an `Error` if the reducer is not a function.

## some

Tells whether at least one value satisfies the predicate. It stops at the first match and closes the source, so it also works on infinite sources that contain a match. It returns `false` when the chain is empty.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .from([1, 2, 3])
        .some(v => v > 2);
    // true
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Functions.some([1, 2, 3], v => v > 2);
    // true
    ```

Throws an `Error` if the predicate is not a function.
