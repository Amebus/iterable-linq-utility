# Transformations

A **Transformation** adds an operation to the **O~s~C** and returns a new chain. Nothing runs until an [Action](actions.md) runs the chain, and every run of the chain runs the transformations again.

The functions that start a chain (`from`, `fromRange`, `repeat` and `empty`) are listed here too: they are the first link of every **O~s~C**.

???+ summary "TLDR list of Transformations"

    - :material-ray-start: Starts a new chain
    - :material-moon-full: [Fully Deferred Execution](../glossary.md#fully-deferred-execution)
    - :material-valve-open: [Eager Evaluation](../glossary.md#eager-evaluation)
    - :material-format-text-wrapping-wrap: Available on the `IIterableLinq` chain
    - :material-raw: Available as raw function in `Functions`

    | Transformation                               | Brief Description                                                                | Execution                                   | Availability                                        |
    | -------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------- |
    | [empty](#empty) :material-ray-start:         | Starts a chain with no values                                                    | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [filter](#filter)                            | Keeps only the values that satisfy a predicate                                   | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [flatMap](#flatmap)                          | Maps each value to an `Iterable` and flattens the results                        | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [from](#from) :material-ray-start:           | Starts a chain over any `Iterable`                                               | :material-moon-full:                        | :material-format-text-wrapping-wrap:                |
    | [fromRange](#fromrange) :material-ray-start: | Starts a chain of numbers from *start* up to, but not including, *end*           | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [map](#map)                                  | Transforms each value                                                            | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [memoize](#memoize)                          | Caches the values the first time they are read                                   | :material-moon-full: :material-valve-open:  | :material-format-text-wrapping-wrap: :material-raw: |
    | [repeat](#repeat) :material-ray-start:       | Starts a chain that yields the same value *n* times                              | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [skip](#skip)                                | Skips the first *count* values and yields the rest                              | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [take](#take)                                | Yields the first *count* values, then closes the source                          | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |

    For `tap`, `tapChain` and `tapChainCreation` see [Taps](taps.md).

## empty

Starts a chain with no values.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .empty<number>()
        .collectToArray();
    // []
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Array.from(Functions.empty());
    // []
    ```

## filter

Keeps only the values that satisfy the predicate. The predicate is called with each value and its index.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .from([1, 2, 3, 4])
        .filter(v => v % 2 === 0)
        .collectToArray();
    // [2, 4]
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Array.from(Functions.filter([1, 2, 3, 4], v => v % 2 === 0));
    // [2, 4]
    ```

Throws an `Error` if the predicate is not a function.

With a type guard, `filter` narrows the element type. Later operations receive that type without a cast.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    const values: (number | string)[] = [1, 'two', 3, 'four'];
    const strings = IterableLinq.from(values)
        .filter((value): value is string => typeof value === 'string');
    // IIterableLinq<string>
    strings.map(value => value.toUpperCase()).collectToArray();
    // ['TWO', 'FOUR']
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    const values: (number | string)[] = [1, 'two', 3, 'four'];
    const strings = Functions.filter(values, (value): value is string => typeof value === 'string');
    // Iterable<string>
    Array.from(Functions.map(strings, value => value.toUpperCase()));
    // ['TWO', 'FOUR']
    ```

A predicate whose return type is `boolean` preserves the source element type. A type guard still receives the source value and its index; filtering remains lazy and re-runnable.

## flatMap

Maps each value to an `Iterable` and flattens the results into one chain. Each inner `Iterable` is read completely before the next value is mapped. The mapper is called with each value and its index.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .from([1, 2])
        .flatMap(v => [v, v * 10])
        .collectToArray();
    // [1, 10, 2, 20]
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Array.from(Functions.flatMap([1, 2], v => [v, v * 10]));
    // [1, 10, 2, 20]
    ```

The mapper can return any `Iterable`, for example a string or a `Set`:

```typescript
IterableLinq
    .from(['ab', 'c'])
    .flatMap(word => word)
    .collectToArray();
// ['a', 'b', 'c']
```

Throws an `Error` if the mapper is not a function.

## from

Starts a chain over any `Iterable`: an array, a string, a `Set`, a `Map`, a generator object, another chain… The source is not copied: every run of the chain iterates the source again.

```typescript
import * as IterableLinq from 'iterable-linq-utility';

IterableLinq.from([1, 2, 3]).collectToArray();
// [1, 2, 3]

IterableLinq.from('abc').collectToArray();
// ['a', 'b', 'c']

IterableLinq.from(new Map([['a', 1]])).collectToArray();
// [['a', 1]]
```

Throws an `Error` if the argument is missing or does not implement `[Symbol.iterator]`.

!!! warning "Single-use sources"
    A generator object can be iterated only once. A chain over it gives values on the first run only. Use [memoize](#memoize) to run such a chain more than once.

## fromRange

Starts a chain of numbers from *start* (default `0`) up to, but not including, *end*.

- The direction comes from *start* and *end*: when *end* is smaller than *start* the numbers decrease.
- `options.step` is the distance between two values (default `1`). Its sign is ignored.
- `options.reverse` yields the same numbers in reverse order.
- Values are computed as `start + index * step`, so decimal steps do not accumulate rounding errors.
- A `NaN` bound gives an empty chain.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq.fromRange(3).collectToArray();
    // [0, 1, 2]

    IterableLinq.fromRange(1, 7, { step: 2 }).collectToArray();
    // [1, 3, 5]

    IterableLinq.fromRange(5, 0).collectToArray();
    // [5, 4, 3, 2, 1]

    IterableLinq.fromRange(3, { reverse: true }).collectToArray();
    // [2, 1, 0]

    IterableLinq.fromRange(0, 1, { step: 0.25 }).collectToArray();
    // [0, 0.25, 0.5, 0.75]
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Array.from(Functions.range(1, 7, { step: 2 }));
    // [1, 3, 5]
    ```

Throws an `Error` if:

- `options` is not an object;
- `step` is `0`, `NaN` or infinite;
- `options` is passed as third argument while *start* is omitted, as in `fromRange(3, undefined, { step: 2 })`.

## map

Transforms each value. The mapper is called with each value and its index.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .from([1, 2, 3, 4])
        .map(v => v * 10)
        .collectToArray();
    // [10, 20, 30, 40]
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Array.from(Functions.map([1, 2, 3, 4], v => v * 10));
    // [10, 20, 30, 40]
    ```

Throws an `Error` if the mapper is not a function.

## memoize

Caches the values the first time they are read, so later runs of the chain read the cache instead of running the source again.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    let reads = 0;
    const cached = IterableLinq
        .from([1, 2, 3])
        .map(v => { reads++; return v * 10; })
        .memoize();

    cached.collectToArray(); // [10, 20, 30]
    cached.collectToArray(); // [10, 20, 30]
    reads;
    // 3: the map ran once per value
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    const cached = Functions.memoize(Functions.map([1, 2, 3], v => v * 10));
    Array.from(cached); // [10, 20, 30]
    Array.from(cached); // [10, 20, 30], from the cache
    ```

`memoize` accepts an options object:

| Option                    | Default | Behaviour                                                                                                                             |
| ------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `allowPartialMemoization` | `true`  | `true`: the cache fills as far as the consumers read. `false`: the first read reads the whole source into the cache. |

With partial memoization, a consumer that stops early (for example [some](actions.md#some)) keeps the source open, so that another consumer can continue from where it stopped.

If the source throws, every later read past the cached values throws the same error.

Unlike [materialize](actions.md#materialize), `memoize` does not run anything when it is called.

## repeat

Starts a chain that yields the same value *count* times.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .repeat(5, 3)
        .collectToArray();
    // [5, 5, 5]
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Array.from(Functions.repeat(5, 3));
    // [5, 5, 5]
    ```

Throws an `Error` if *count* is negative, not an integer, `NaN` or `Infinity`.

## skip

Skips the first *count* values and yields the rest, preserving their order. This Transformation is lazy and re-runnable when the source is re-runnable.

*count* must be a non-negative integer. Negative values, fractions, `NaN` and `Infinity` throw when `skip` is called. Zero keeps all values; a count at least as large as a finite source leaves an empty result.

=== "Wrapper"

    ```ts
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq.from([1, 2, 3, 4, 5])
        .skip(2)
        .collectToArray();
    // [3, 4, 5]
    ```

=== "Raw Function"

    ```ts
    import { Functions } from 'iterable-linq-utility';

    Array.from(Functions.skip([1, 2, 3, 4, 5], 2));
    // [3, 4, 5]
    ```

The skipped values are read only when consumption starts. Each consumer reads only as far as it needs. `skip` works with infinite sources but does not end them: combine it with `take` to consume a finite part. Stopping consumption early closes the source iterator.

=== "Wrapper"

    ```ts
    import * as IterableLinq from 'iterable-linq-utility';

    function* integers() {
        let value = 0;
        while (true) yield value++;
    }

    IterableLinq.from({ [Symbol.iterator]: integers })
        .skip(3)
        .take(2)
        .collectToArray();
    // [3, 4], after reading exactly five source values
    ```

=== "Raw Function"

    ```ts
    import { Functions } from 'iterable-linq-utility';

    function* integers() {
        let value = 0;
        while (true) yield value++;
    }

    Array.from(Functions.take(Functions.skip({ [Symbol.iterator]: integers }, 3), 2));
    // [3, 4], after reading exactly five source values
    ```

## take

Yields the first *count* values, then closes the source. The source is never read past the *count*-th value, so `take` also ends an infinite chain.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .from([1, 2, 3, 4, 5])
        .take(3)
        .collectToArray();
    // [1, 2, 3]
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Array.from(Functions.take([1, 2, 3, 4, 5], 3));
    // [1, 2, 3]
    ```

Throws an `Error` if *count* is negative, not an integer, `NaN` or `Infinity`.
