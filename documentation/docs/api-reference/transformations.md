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
    | [append](#append)                            | Yields the values, then one more value                                           | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [concat](#concat)                            | Yields the values, then the values of other iterables                            | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [distinct](#distinct)                        | Keeps the first value for each distinct value or selected key                    | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [empty](#empty) :material-ray-start:         | Starts a chain with no values                                                    | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [filter](#filter)                            | Keeps only the values that satisfy a predicate                                   | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [flatMap](#flatmap)                          | Maps each value to an `Iterable` and flattens the results                        | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [from](#from) :material-ray-start:           | Starts a chain over any `Iterable`                                               | :material-moon-full:                        | :material-format-text-wrapping-wrap:                |
    | [fromRange](#fromrange) :material-ray-start: | Starts a chain of numbers from *start* up to, but not including, *end*           | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [map](#map)                                  | Transforms each value                                                            | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [memoize](#memoize)                          | Caches the values the first time they are read                                   | :material-moon-full: :material-valve-open:  | :material-format-text-wrapping-wrap: :material-raw: |
    | [prepend](#prepend)                          | Yields one value, then the values                                                | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [repeat](#repeat) :material-ray-start:       | Starts a chain that yields the same value *n* times                              | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [skip](#skip)                                | Skips the first *count* values and yields the rest                              | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [skipWhile](#skipwhile)                      | Skips the values while a predicate is satisfied and yields the rest              | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [slice](#slice)                              | Yields the values from *start* to *end*, like `Array.prototype.slice`            | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [take](#take)                                | Yields the first *count* values, then closes the source                          | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [takeLast](#takelast)                        | Yields the last *count* values                                                   | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [takeWhile](#takewhile)                      | Yields the values while a predicate is satisfied, then closes the source         | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |

    For `tap`, `tapChain` and `tapChainCreation` see [Taps](taps.md).

## append

Yields the values of the chain, then *value*. *value* is yielded only when the source ends, so it is never reached on an infinite chain.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .from([1, 2, 3])
        .append(4)
        .collectToArray();
    // [1, 2, 3, 4]
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Array.from(Functions.append([1, 2, 3], 4));
    // [1, 2, 3, 4]
    ```

## concat

Yields the values of the chain, then the values of each iterable in *others*, in order. Each iterable is opened only when the previous one ends, so the iterables after an infinite chain are never read. Stopping early closes only the iterable being read.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .from([1, 2])
        .concat([3], new Set([4, 5]))
        .collectToArray();
    // [1, 2, 3, 4, 5]
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Array.from(Functions.concat([1, 2], [3], new Set([4, 5])));
    // [1, 2, 3, 4, 5]
    ```

Throws an `Error` if a value of *others* is missing or is not an `Iterable`.

## distinct

Lazily yields the first value for each distinct value or selected key, in source order. Values are returned unchanged.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq.from([3, 1, 3, 2, 1]).distinct().collectToArray();
    // [3, 1, 2]

    IterableLinq.from([{ id: 1 }, { id: 1 }, { id: 2 }])
        .distinct(v => v.id)
        .collectToArray();
    // [{ id: 1 }, { id: 2 }]
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Array.from(Functions.distinct([3, 1, 3, 2, 1]));
    // [3, 1, 2]

    Array.from(Functions.distinct([{ id: 1 }, { id: 1 }, { id: 2 }], v => v.id));
    // [{ id: 1 }, { id: 2 }]
    ```

Keys use `SameValueZero`, like `Set`: `NaN` equals `NaN`, and `+0` and `-0` are equal. The first original value is retained, including its signed zero. Objects are compared by reference unless a selector supplies another key.

The optional `keySelector` is called with every value and its index, duplicates included; without it the values are compared directly. Throws an `Error` if the selector is not a function.

Memory grows with the number of distinct keys.

An infinite source can be consumed with a downstream limit:

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    function* repeated() {
        for (let value = 0; ; value++) yield Math.floor(value / 2);
    }
    IterableLinq.from(repeated()).distinct().take(3).collectToArray();
    // [0, 1, 2]
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    function* repeated() {
        for (let value = 0; ; value++) yield Math.floor(value / 2);
    }
    Array.from(Functions.take(Functions.distinct(repeated()), 3));
    // [0, 1, 2]
    ```

Asking for another distinct value keeps reading until a new key or the end is found: an infinite source with only already-seen keys never yields again.

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

## prepend

Yields *value*, then the values of the chain. *value* is yielded before the source is read.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .from([1, 2, 3])
        .prepend(0)
        .collectToArray();
    // [0, 1, 2, 3]
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Array.from(Functions.prepend([1, 2, 3], 0));
    // [0, 1, 2, 3]
    ```

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

## skipWhile

Skips the values while the predicate returns `true`, then yields the first rejected value and all the rest. The predicate is called with each value and its index, and is not called again after the first rejected value.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .from([1, 2, 5, 3])
        .skipWhile(v => v < 4)
        .collectToArray();
    // [5, 3]
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Array.from(Functions.skipWhile([1, 2, 5, 3], v => v < 4));
    // [5, 3]
    ```

Throws an `Error` if the predicate is not a function.

## slice

Yields the values from *start* to *end* (excluded), like `Array.prototype.slice`; a negative index counts from the end. *start* is `0` by default, and without *end* the values are yielded up to the end of the chain.

- With non-negative indexes, the values are yielded as they are read and the source is closed at *end*, so `slice` also ends an infinite chain.
- A negative *end* yields each value once `-end` more values have been read, keeping only those `-end` values.
- A negative *start* runs the whole chain before yielding, keeping only the last `-start` values.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .from([1, 2, 3, 4, 5])
        .slice(1, 3)
        .collectToArray();
    // [2, 3]

    IterableLinq
        .from([1, 2, 3, 4, 5])
        .slice(-2)
        .collectToArray();
    // [4, 5]
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Array.from(Functions.slice([1, 2, 3, 4, 5], 1, 3));
    // [2, 3]

    Array.from(Functions.slice([1, 2, 3, 4, 5], -2));
    // [4, 5]
    ```

Throws an `Error` if *start* or *end* is given and is not an integer (fractions, `NaN` and `Infinity` included). Unlike `Array.prototype.slice`, they are not converted to integers.

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

## takeLast

Yields the last *count* values. The whole chain runs before the first value is yielded, keeping only the last *count* values, so `takeLast` does not end on an infinite chain.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .from([1, 2, 3, 4, 5])
        .takeLast(2)
        .collectToArray();
    // [4, 5]
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Array.from(Functions.takeLast([1, 2, 3, 4, 5], 2));
    // [4, 5]
    ```

Throws an `Error` if *count* is negative, not an integer, `NaN` or `Infinity`. Zero yields no value and closes the source without reading it.

## takeWhile

Yields the values while the predicate returns `true`, then closes the source. The predicate is called with each value and its index. The first rejected value is not yielded and the source is never read past it, so `takeWhile` can end an infinite chain.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .from([1, 2, 5, 3])
        .takeWhile(v => v < 4)
        .collectToArray();
    // [1, 2]
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Array.from(Functions.takeWhile([1, 2, 5, 3], v => v < 4));
    // [1, 2]
    ```

Throws an `Error` if the predicate is not a function.

With a type guard, `takeWhile` narrows the element type, as `filter` does.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    const values: (number | string)[] = [1, 2, 'three', 4];
    IterableLinq.from(values)
        .takeWhile((v): v is number => typeof v === 'number')
        .map(v => v * 10)
        .collectToArray();
    // [10, 20]
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    const values: (number | string)[] = [1, 2, 'three', 4];
    Array.from(Functions.takeWhile(values, (v): v is number => typeof v === 'number'));
    // number[], [1, 2]
    ```
