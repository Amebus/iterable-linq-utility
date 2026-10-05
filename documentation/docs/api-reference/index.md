# API Reference

The library has two ways to use every operation:

- **the chain**: the functions below return an `IIterableLinq`, a lazy and re-runnable wrapper whose methods compose an **O~s~C**;
- **the raw functions** in `Functions`: the same operations as plain functions over any `Iterable`, without the wrapper.

=== "Chain"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .from([1, 2, 3, 4])
        .filter(v => v % 2 === 0)
        .map(v => v * 10)
        .collectToArray();
    // [20, 40]
    ```
=== "Raw Functions"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    const evens = Functions.filter([1, 2, 3, 4], v => v % 2 === 0);
    Functions.collectToArray(Functions.map(evens, v => v * 10));
    // [20, 40]
    ```

The operations are grouped by what they do:

- [Actions](actions.md) run the chain and return a result;
- [Transformations](transformations.md) add an operation to the chain and return a new chain;
- [Taps](taps.md) observe the chain without changing its values.

## Starting a chain

| Function                                    | Starts a chain over                                                     |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| [from](transformations.md#from)             | any `Iterable`: arrays, strings, `Set`, `Map`, generators, other chains |
| [fromObject](transformations.md#fromobject) | the entries, keys, values or descriptors of an object                   |
| [fromRange](transformations.md#fromrange)   | a range of numbers                                                      |
| [repeat](transformations.md#repeat)         | the same value, repeated *n* times                                      |
| [empty](transformations.md#empty)           | no values                                                               |

## Extending the chain

| Function          | Purpose                                                          |
| ----------------- | ---------------------------------------------------------------- |
| `isIterableLinq`  | Tells whether a value is a chain created by this library         |
| `extend`          | Adds a method to every chain                                     |
| `override`        | Replaces an existing method of every chain                       |

See [Extending the API](../advanced-concepts/extending.md).

## Exported types

| Type                         | Description                                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| `IIterableLinq<T>`           | The chain. Augment it to declare the methods added with `extend`                                     |
| `IIterableLinqBase<T>`       | The methods the library provides on every chain                                                       |
| `Unit`                       | The type of `unit()`, returned by callbacks that have nothing to return. See [The Unit type](../basic-concepts.md#the-unit-type) |
| `IRangeOptions`              | Options of `fromRange` and `Functions.range`: `step` and `reverse`                                    |
| `IMemoizeOptions`            | Options of `memoize`: `allowPartialMemoization`                                                       |
| `IObjectOptions`             | Options of `fromObject`: `yield`, `inherited`, `nonEnumerable` and `symbols`                          |
| `ObjectItem<O, Options>`     | The type of the values of `fromObject`, from `ObjectKey` and `ObjectValue`                            |
| `Comparer<T>`                | How `min` and `max` compare: a compare function, a key or a list of keys                              |
| `Mapper<T, R>`               | Callback of `map` and `flatMap`: `(value, index) => R`                                                |
| `Predicate<T>`               | Callback of `filter` and `some`: `(value, index) => boolean`                                          |
| `Reducer<T, R>`              | Callback of `reduce`: `(acc, value, index) => R`                                                      |
| `Action<T>`                  | Callback of `forEach`: `(value, index) => Unit`                                                       |
| `AsyncAction<T>`             | Callback of `forEachAsync`: `(value, index) => Promise<Unit>`                                         |
| `Tapper<T>`                  | Callback of `tap` and `tapChain`: `(value, index) => Unit`                                            |
| `ChainMethod`                | Implementation passed to `extend` and `override`                                                      |

Every exported symbol has a JSDoc comment with a description, the parameters, the errors, an example and the version that introduced it (`@since`): your editor shows it on hover.
