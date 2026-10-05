# Basic Concepts

## Actions, Transformations and Taps

!!! summary "TLDR"

    | Operations                                          | Returned Type            | Behaviour                                                                                                                                         |
    | --------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
    | [Actions](api-reference/actions.md)                 | Primitive Type or Object | Runs the **O~s~C** on which it is called. The operation requested by the action runs immediately.                                              |
    | [Transformations](api-reference/transformations.md) | `IIterableLinq`          | Adds a data manipulation operation to the **O~s~C** on which it is called. The operation runs only when an action runs the **O~s~C**.         |
    | [Taps](api-reference/taps.md)                       | `IIterableLinq`          | Observes the **O~s~C** without changing its values, for example to log them.                                                                  |

!!! quote
    Transformations create RDDs from each other, but when we want to work with the actual dataset, at that point action is performed. When the action is triggered after the result, new RDD is not formed like transformation.  
    Thus, Actions are Spark RDD operations that give non-RDD values.  
    The values of action are stored to drivers or to the external storage system. It brings laziness of RDD into motion. [^1]

With the same idea of [Apache Spark](https://spark.apache.org/) in mind, the `iterable-linq-utility` package provides two main kinds of operations, plus the taps:

- [Actions](api-reference/actions.md)
- [Transformations](api-reference/transformations.md)
- [Taps](api-reference/taps.md)

### Actions

[Actions](api-reference/actions.md) are **ending operations**: they run the **operations chain** and return the result of the computation.  
The simplest **Action** is `collectToArray`, which returns an array with all the values of the **operations chain**.
Other common [Actions](api-reference/actions.md) are `some`, `reduce`, `max` and `min`.  

!!! info
    [materialize](api-reference/actions.md#materialize) is an **Action** even if it returns an `IIterableLinq`. It runs the chain immediately and stores the values; the returned `IIterableLinq` lets you continue the data manipulation from the stored values, starting a new **operations chain**.

### Transformations

[Transformations](api-reference/transformations.md) compose the **O~s~C**: each one adds a data manipulation operation and returns a new chain.
The simplest and best known **Transformation** is `map`, which changes the shape of every value.
Other common [Transformations](api-reference/transformations.md) are `filter` and `flatMap`.  

### Taps

[Taps](api-reference/taps.md) let you look at the **O~s~C** without changing it: `tap` sees each value, `tapChain` sees each run, `tapChainCreation` sees the chain while it is being built. They are useful for logging and debugging.

## Deferred Execution

Building a chain runs nothing. The transformations run only when an action asks for the values, and they read the source one value at a time, only as far as the action needs.

```typescript
import * as IterableLinq from 'iterable-linq-utility';

const chain = IterableLinq
    .fromRange(1_000_000)
    .map(v => v * 2); // nothing runs here

chain.some(v => v > 10);
// true: map ran on the first 7 values only (0 to 6)
```

Every action runs the chain again, from the source: a chain is **re-runnable**. To avoid running an expensive chain twice, store its values with [memoize](api-reference/transformations.md#memoize) or [materialize](api-reference/actions.md#materialize).

See [Deferred Execution](glossary.md#deferred-execution) and [Repeatable Execution](glossary.md#repeatable-execution) in the glossary.

## Equality

JavaScript has three ways to compare two values, which differ only on `NaN` and `-0`:

| Comparison      | `NaN` vs `NaN` | `0` vs `-0` |
| --------------- | -------------- | ----------- |
| `===`           | not equal      | equal       |
| `SameValueZero` | equal          | equal       |
| `Object.is`     | equal          | not equal   |

The operations that compare values follow one rule: an operation with a native counterpart compares like it, every other one uses `SameValueZero`, like `Set` and `Map`. Objects are always compared by reference.

| Operation                                                    | Equality        | Like                                           |
| ------------------------------------------------------------ | --------------- | ---------------------------------------------- |
| [indexOf](api-reference/actions.md#indexof), [lastIndexOf](api-reference/actions.md#lastindexof) | `===`           | `Array.prototype.indexOf` and `lastIndexOf`    |
| [includes](api-reference/actions.md#includes)                | `SameValueZero` | `Array.prototype.includes`                     |
| [distinct](api-reference/transformations.md#distinct), [union](api-reference/transformations.md#union), [intersect](api-reference/transformations.md#intersect), [except](api-reference/transformations.md#except) | `SameValueZero` | `Set` |
| [collectToSet](api-reference/actions.md#collecttoset), [collectToMap](api-reference/actions.md#collecttomap) | `SameValueZero` | `Set` and `Map`                                |
| [sequenceEqual](api-reference/actions.md#sequenceequal)      | `SameValueZero` | `Set` and `Map`; pass `equals` to change it    |

So `indexOf(NaN)` is `-1` while `includes(NaN)` is `true`, exactly as with arrays. For a different equality, pass a callback: `sequenceEqual(other, Object.is)` tells `0` from `-0`, a key selector compares objects by a field.

## The `Unit` type

Callbacks that have nothing to return, like the ones passed to `forEach`, `forEachAsync`, `tap` and `tapChain`, return `unit()`: the only value of the `Unit` type.
`Unit` is nominal, so the compiler rejects a callback that returns anything else (a number, a string, an object, `undefined`).

```typescript
import * as IterableLinq from 'iterable-linq-utility';
import { unit } from 'iterable-linq-utility';

IterableLinq
    .from([1, 2, 3])
    .forEach(v => {
        console.log(v);
        return unit();
    });
```

[^1]: [Spark RDD Operations-Transformation & Action with Example](https://data-flair.training/blogs/spark-rdd-operations-transformations-actions/)
