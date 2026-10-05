# Actions

An **Action** runs the **O~s~C** and returns a result. Every call to an action runs the whole chain again, from the source.

???+ summary "TLDR list of Actions"
    | Action                            | Brief Description                                                                     | Returns                     |
    | --------------------------------- | ------------------------------------------------------------------------------------- | --------------------------- |
    | [at](#at)                         | Returns the value at an index; a negative index counts from the end                   | `T | undefined`             |
    | [average](#average)               | Returns the average of the values, or of the numbers returned by a selector           | `number | undefined`        |
    | [collectToArray](#collecttoarray) | Collects the values into an `Array`                                                   | `T[]`                       |
    | [collectToMap](#collecttomap)     | Collects the values into a `Map`, by a selected key                                   | `Map<K, T>` or `Map<K, V>`  |
    | [count](#count)                   | Counts the values, or the values that satisfy a predicate                             | `number`                    |
    | [every](#every)                   | Tells whether every value satisfies a predicate                                       | `boolean`                   |
    | [find](#find)                     | Returns the first value that satisfies a predicate                                    | `T | undefined`             |
    | [findIndex](#findindex)           | Returns the index of the first value that satisfies a predicate                       | `number`                    |
    | [findLast](#findlast)             | Returns the last value that satisfies a predicate                                     | `T | undefined`             |
    | [findLastIndex](#findlastindex)   | Returns the index of the last value that satisfies a predicate                        | `number`                    |
    | [forEach](#foreach)               | Calls a callback on each value                                                        | `Unit`                      |
    | [forEachAsync](#foreachasync)     | Calls an async callback on each value, one after the other                            | `Promise<Unit>`             |
    | [includes](#includes)             | Tells whether the chain contains a value                                              | `boolean`                   |
    | [indexOf](#indexof)               | Returns the index of the first value equal to a value                                 | `number`                    |
    | [join](#join)                     | Joins the values in a string, like `Array.prototype.join`                             | `string`                    |
    | [lastIndexOf](#lastindexof)       | Returns the index of the last value equal to a value                                  | `number`                    |
    | [materialize](#materialize)       | Runs the chain now and stores its values in a new chain                               | `IIterableLinq<T>`          |
    | [max](#max)                       | Returns the greatest value                                                            | `T | undefined`             |
    | [min](#min)                       | Returns the smallest value                                                            | `T | undefined`             |
    | [reduce](#reduce)                 | Accumulates the values into a single result                                           | `R`, or `T` without a seed  |
    | [sequenceEqual](#sequenceequal)   | Tells whether the chain and another iterable have the same values in the same order   | `boolean`                   |
    | [single](#single)                 | Returns the only value, or the only value that satisfies a predicate                  | `T | undefined`             |
    | [some](#some)                     | Tells whether at least one value satisfies a predicate                                | `boolean`                   |
    | [sum](#sum)                       | Returns the sum of the values, or of the numbers returned by a selector               | `number`                    |

## at

Returns the value at the index, or `undefined` if the chain has no value there, like `Array.prototype.at`. A negative index counts from the end: `-1` is the last value.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq.from([10, 20, 30]).at(1);
    // 20

    IterableLinq.from([10, 20, 30]).at(-1);
    // 30
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Functions.at([10, 20, 30], 1);
    // 20

    Functions.at([10, 20, 30], -1);
    // 30
    ```

Throws an `Error` if the index is not an integer: unlike `Array.prototype.at`, fractions, `NaN` and `Infinity` are rejected instead of truncated, as with [take](transformations.md#take) and [skip](transformations.md#skip).

A non-negative index reads the chain up to the value, then closes the source, so it also works on infinite sources. A negative index reads the whole chain, keeping only the last `-index` values in memory: it does not terminate on an infinite source.

## average

Returns the average of the values: their sum, added with `+`, divided by their number; with a selector, the average of the numbers it returns. The selector is called with each value and its index. It returns `undefined` when the chain is empty. The values are not checked: a `NaN` makes the result `NaN`. It reads the whole chain, so it does not terminate on an infinite source: limit it first, for example with `take` or `takeWhile`.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq.from([1, 2, 3, 4]).average();
    // 2.5

    IterableLinq
        .from(['a', 'bb', 'ccc'])
        .average(v => v.length);
    // 2
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Functions.average([1, 2, 3, 4]);
    // 2.5

    Functions.average(['a', 'bb', 'ccc'], v => v.length);
    // 2
    ```

Without a selector, the chain must contain numbers: TypeScript rejects `average()` on a chain of other values. Throws an `Error` if a provided selector is not a function. Passing `undefined` is the same as omitting it.

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

## collectToMap

Collects the values of the chain into a `Map`, with the key returned by the key selector. A later value with the same key replaces the earlier one; the keys are compared as `Map` does (`SameValueZero`). The value selector, when given, returns the value to store instead of the value itself. Both selectors are called with each value and its index.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    const people = [{ id: 1, name: 'Ada' }, { id: 2, name: 'Bob' }];

    IterableLinq
        .from(people)
        .collectToMap(p => p.id);
    // Map { 1 => { id: 1, name: 'Ada' }, 2 => { id: 2, name: 'Bob' } }

    IterableLinq
        .from(people)
        .collectToMap(p => p.id, p => p.name);
    // Map { 1 => 'Ada', 2 => 'Bob' }
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Functions.collectToMap(people, p => p.id, p => p.name);
    // Map { 1 => 'Ada', 2 => 'Bob' }
    ```

Throws an `Error` if the key selector is not a function, or if a value selector is given and is not a function.

## count

Counts the values of the chain; with a predicate, only the values that satisfy it. The predicate is called with each value and its index. It reads the whole chain, so it does not terminate on an infinite source: limit it first, for example with `take` or `takeWhile`.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq.from([1, 5, 2, 6]).count();
    // 4

    IterableLinq
        .from([1, 5, 2, 6])
        .count(v => v > 4);
    // 2
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Functions.count([1, 5, 2, 6]);
    // 4

    Functions.count([1, 5, 2, 6], v => v > 4);
    // 2
    ```

Throws an `Error` if a provided predicate is not a function. Passing `undefined` is the same as omitting it.

## every

Tells whether every value satisfies the predicate. The predicate is called with each value and its index. It stops at the first rejected value and closes the source, so it also works on infinite sources that contain a rejected value. It returns `true` when the chain is empty, like `Array.prototype.every`.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .from([1, 2, 3])
        .every(v => v > 0);
    // true
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Functions.every([1, 2, 3], v => v > 0);
    // true
    ```

Throws an `Error` if the predicate is not a function.

## find

Returns the first value that satisfies the predicate, or `undefined` if there is none. The predicate is called with each value and its index. It stops at the first match and closes the source, so it also works on infinite sources that contain a match. As with `Array.prototype.find`, an accepted `undefined` value and no match both return `undefined`.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .from([1, 5, 6])
        .find(v => v > 4);
    // 5
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Functions.find([1, 5, 6], v => v > 4);
    // 5
    ```

Throws an `Error` if the predicate is not a function.

With a type guard, `find` narrows the type of the result, as `filter` does.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    const values: (number | string)[] = [1, 'two', 3];
    IterableLinq.from(values).find((v): v is string => typeof v === 'string');
    // string | undefined, 'two'
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    const values: (number | string)[] = [1, 'two', 3];
    Functions.find(values, (v): v is string => typeof v === 'string');
    // string | undefined, 'two'
    ```

## findIndex

Returns the index of the first value that satisfies the predicate, or `-1` if there is none, like `Array.prototype.findIndex`. The predicate is called with each value and its index. The index counts the values of the chain, from 0. It stops at the first match and closes the source, so it also works on infinite sources that contain a match.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .from([1, 5, 6])
        .findIndex(v => v > 4);
    // 1
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Functions.findIndex([1, 5, 6], v => v > 4);
    // 1
    ```

Throws an `Error` if the predicate is not a function.

## findLast

Returns the last value that satisfies the predicate, or `undefined` if there is none, like `Array.prototype.findLast`. The predicate is called with each value and its index. It reads the whole chain, so it does not terminate on an infinite source: limit it first, for example with `take` or `takeWhile`. An accepted `undefined` value and no match both return `undefined`.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .from([1, 5, 6, 2])
        .findLast(v => v > 4);
    // 6
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Functions.findLast([1, 5, 6, 2], v => v > 4);
    // 6
    ```

Throws an `Error` if the predicate is not a function.

With a type guard, `findLast` narrows the type of the result, as [find](#find) does.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    const values: (number | string)[] = [1, 'two', 3, 'four'];
    IterableLinq.from(values).findLast((v): v is string => typeof v === 'string');
    // string | undefined, 'four'
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    const values: (number | string)[] = [1, 'two', 3, 'four'];
    Functions.findLast(values, (v): v is string => typeof v === 'string');
    // string | undefined, 'four'
    ```

## findLastIndex

Returns the index of the last value that satisfies the predicate, or `-1` if there is none, like `Array.prototype.findLastIndex`. The predicate is called with each value and its index; the index counts the values of the chain, from 0. It reads the whole chain, so it does not terminate on an infinite source: limit it first, for example with `take` or `takeWhile`.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .from([1, 5, 6, 2])
        .findLastIndex(v => v > 4);
    // 2
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Functions.findLastIndex([1, 5, 6, 2], v => v > 4);
    // 2
    ```

Throws an `Error` if the predicate is not a function.

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

## includes

Tells whether the chain contains the value. Values are compared with `SameValueZero`, like `Array.prototype.includes`: `NaN` matches `NaN`, `+0` matches `-0`, and objects are compared by reference. It stops at the first match and closes the source, so it also works on infinite sources that contain the value.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .from([1, 2, NaN])
        .includes(NaN);
    // true
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Functions.includes([1, 2, NaN], NaN);
    // true
    ```

## indexOf

Returns the index of the first value strictly equal (`===`) to the given value, or `-1` if there is none, like `Array.prototype.indexOf`. The index counts the values of the chain, from 0. It stops at the first match and closes the source, so it also works on infinite sources that contain the value.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .from([1, 2, 3, 2])
        .indexOf(2);
    // 1
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Functions.indexOf([1, 2, 3, 2], 2);
    // 1
    ```

With `===`, `NaN` is never found and `+0` equals `-0`. To look for `NaN`, use [includes](#includes) or [findIndex](#findindex) with `Number.isNaN`.

## join

Joins the values of the chain in a string, like `Array.prototype.join`: the separator goes between two values and defaults to `,`. `null` and `undefined` become empty strings, every other value is converted with its `toString`. It returns `''` when the chain is empty. It reads the whole chain, so it does not terminate on an infinite source: limit it first, for example with `take` or `takeWhile`.

The relational join of LINQ is a different operation, planned as `innerJoin`.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq.from([1, 2, 3]).join();
    // '1,2,3'

    IterableLinq
        .from(['a', 'b'])
        .join(' - ');
    // 'a - b'
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Functions.join([1, 2, 3]);
    // '1,2,3'

    Functions.join(['a', 'b'], ' - ');
    // 'a - b'
    ```

## lastIndexOf

Returns the index of the last value strictly equal (`===`) to the given value, or `-1` if there is none, like `Array.prototype.lastIndexOf`. The index counts the values of the chain, from 0. It reads the whole chain, so it does not terminate on an infinite source: limit it first, for example with `take` or `takeWhile`.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .from([1, 2, 3, 2])
        .lastIndexOf(2);
    // 3
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Functions.lastIndexOf([1, 2, 3, 2], 2);
    // 3
    ```

As with [indexOf](#indexof), `NaN` is never found and `+0` equals `-0`.

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

Without a seed, the first value is the initial accumulator, like `Array.prototype.reduce` without `initialValue` and `Aggregate(func)` in LINQ. The reducer starts from the second value, with `index` 1; with one value, `reduce` returns it and does not call the reducer.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .from([3, 7, 2])
        .reduce((acc, v) => (v > acc ? v : acc));
    // 7
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Functions.reduce([3, 7, 2], (acc, v) => (v > acc ? v : acc));
    // 7
    ```

The number of arguments, not their type, tells the two forms apart: `reduce(undefined, reducer)` has the seed `undefined`. Without a seed, `reduce` throws an `Error` if the chain is empty.

## sequenceEqual

Tells whether the chain and another iterable have the same values in the same order. The values are compared with `===`, or with the given `equals`, called with a value of the chain and the value of the other iterable at the same position. Two empty sources are equal; sources of different length are not.

It reads the two sources side by side, and stops at the first difference or when one source ends before the other, closing the other source: so it terminates when at least one of the two sources is finite or they differ. If `equals` throws, both sources are closed and the error propagates; if one source throws, the other one is closed.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq.from([1, 2, 3]).sequenceEqual([1, 2, 3]);
    // true

    IterableLinq.from([1, 2]).sequenceEqual([1, 2, 3]);
    // false

    IterableLinq
        .from([{ id: 1 }, { id: 2 }])
        .sequenceEqual([{ id: 1 }, { id: 2 }], (a, b) => a.id === b.id);
    // true
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Functions.sequenceEqual([1, 2, 3], [1, 2, 3]);
    // true

    Functions.sequenceEqual([{ id: 1 }], [{ id: 1 }], (a, b) => a.id === b.id);
    // true
    ```

With `===`, `NaN` is not equal to itself: pass `Object.is` as `equals` to compare it. Throws an `Error` if the other iterable is missing or not iterable, or if a provided `equals` is not a function. Passing `undefined` as `equals` is the same as omitting it.

## single

Returns the only value of the chain; with a predicate, the only value that satisfies it. The predicate is called with each value and its index. It returns `undefined` when there is no such value, and throws an `Error` when there is more than one: it stops at the second one and closes the source, so it also ends on an infinite source. Like [find](#find), it returns `undefined` both when there is no value and when the only value is `undefined`.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq.from([5]).single();
    // 5

    IterableLinq
        .from([1, 5, 2])
        .single(v => v > 4);
    // 5

    IterableLinq.from([1, 2]).single();
    // throws Error: [iterable-linq-utility/single] The iterable contains more than one value
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Functions.single([5]);
    // 5

    Functions.single([1, 5, 2], v => v > 4);
    // 5

    Functions.single([5, 6], v => v > 4);
    // throws Error: [iterable-linq-utility/single] More than one value satisfies the predicate
    ```

Throws an `Error` if a provided predicate is not a function. Passing `undefined` is the same as omitting it. A type guard narrows the type of the result, as with [find](#find).

## some

Tells whether at least one value satisfies the predicate; without a predicate, whether the chain has any values. It stops at the first match (without a predicate, at the first value) and closes the source, so it also works on infinite sources that contain a match. It returns `false` when the chain is empty.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .from([1, 2, 3])
        .some(v => v > 2);
    // true

    IterableLinq.from([1, 2, 3]).some();
    // true
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Functions.some([1, 2, 3], v => v > 2);
    // true

    Functions.some([1, 2, 3]);
    // true
    ```

Throws an `Error` if a provided predicate is not a function. Passing `undefined` is the same as omitting it.

## sum

Returns the sum of the values, added with `+`; with a selector, the sum of the numbers it returns. The selector is called with each value and its index. It returns `0` when the chain is empty. The values are not checked: a `NaN` makes the result `NaN`. It reads the whole chain, so it does not terminate on an infinite source: limit it first, for example with `take` or `takeWhile`.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq.from([1, 2, 3]).sum();
    // 6

    IterableLinq
        .from(['a', 'bb', 'ccc'])
        .sum(v => v.length);
    // 6
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Functions.sum([1, 2, 3]);
    // 6

    Functions.sum(['a', 'bb', 'ccc'], v => v.length);
    // 6
    ```

Without a selector, the chain must contain numbers: TypeScript rejects `sum()` on a chain of other values. Throws an `Error` if a provided selector is not a function. Passing `undefined` is the same as omitting it.
