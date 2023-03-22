# Transformations

???+ summary "TLDR list of Transformations"

    - :material-ray-start: Is start of a new chain
    - :material-moon-new: [Immediate Execution](../glossary.md#immediate-execution)
    - :material-circle-half-full: [Partially Deferred Execution](../glossary.md#partially-deferred-execution)
    - :material-moon-full: [Fully Deferred Execution](../glossary.md#fully-deferred-execution)
    - :material-valve-open: [Eager Evaluation](../glossary.md#eager-evaluation)
    - :material-format-text-wrapping-wrap: Available in the `ILinqIterable` wrapper
    - :material-raw: Available as raw function

    | Transformation                               | Brief Description                                                                                                                                                                    |                                             |                                                     |
    | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- | --------------------------------------------------- |
    | [empty](#empty) :material-ray-start:         | Returns an empty `Iterable`                                                                                                                                                          | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [filter](#filter)                            | Returns a new iterable                                                                                                                                                               | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [flatMap](#flatmap)                          |                                                                                                                                                                                      | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [from](#from) :material-ray-start:           |                                                                                                                                                                                      | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [fromRange](#fromrange) :material-ray-start: | Returns an `Iterable` of numbers (positive and/or negative) progressing from *start* up to, but not including, *end*.                                                               | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [map](#map)                                  |                                                                                                                                                                                      | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [memoize](#memoize)                          |                                                                                                                                                                                      | :material-moon-full:  :material-valve-open: | :material-format-text-wrapping-wrap: :material-raw: |
    | [materialize](#materialize)                  | Triggers the **operations chain** and store it in a new `Iterable`. It returns an `ILinqIterable` to allow to create a brand new **operations chain**. Helpful to boost performance. | :material-moon-new:                         | :material-format-text-wrapping-wrap: :material-raw: |
    | [repeat](#repeat) :material-ray-start:       | Returns an `Iterable` which will repeats the given value n times.                                                                                                                   | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [tap](#tap)                                  |                                                                                                                                                                                      | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [tapChain](#tapchain)                        |                                                                                                                                                                                      | :material-moon-full: :material-valve-open:  | :material-format-text-wrapping-wrap: :material-raw: |
    | [tapChainCreation](#tapchaincreation)        |                                                                                                                                                                                      | :material-circle-half-full:                 | :material-format-text-wrapping-wrap:                |

## empty

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility'

    IterableLinq
        .empty()
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

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility'

    IterableLinq
        .from([1,2,3,4])
        .filter( v => v % 2 === 0)
        .collectToArray();
    // [2,4]
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';
    
    Array.from(Functions.filter([1,2,3,4], v => v % 2 === 0));
    // [2,4]
    ```

## flatMap

## from

## fromRange

## map

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility'

    IterableLinq
        .from([1,2,3,4])
        .map( v => v * 10 )
        .collectToArray();
    // [10,20,30,40]
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';
    
    Array.from(Functions.map([1,2,3,4], v => v * 10));
    // [10,20,30,40]
    ```

## memoize

## materialize

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility'

    IterableLinq
        .from([1,2,3,4])
        .materilize()
        .collectToArray();
    // [1,2,3,4]
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';
    
    Array.from(Functions.materialize([1,2,3,4]));
    // [1,2,3,4]
    ```

## repeat

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility'

    IterableLinq
        .repeat(5,3)
        .collectToArray();
    // [5,5,5]
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';
    
    Array.from(Functions.repeat(5, 3));
    // [5,5,5]
    ```

## tap

## tapChain

## tapChainCreation
