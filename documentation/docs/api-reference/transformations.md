# Transformations

???+ summary "TLDR list of Transformations"

    - :material-ray-start: Is start of a new chain
    - :material-moon-full: [Fully Deferred Execution](../glossary.md#fully-deferred-execution)
    - :material-circle-half-full: [Partially Deferred Execution](../glossary.md#partially-deferred-execution)
    - :material-valve-open: [Eager Evaluation](../glossary.md#eager-evaluation)
    - :material-valve: [One by One Evaluation](../glossary.md#one-by-one-evaluation)
    - :material-format-text-wrapping-wrap: Available in the `ILinqIterable` wrapper
    - :material-raw: Available as raw function

    | Transformation                               | Brief Description                                                   |                                                             |                                                     |
    | -------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------- |
    | [empty](#empty) :material-ray-start:         |                                                                     | :material-moon-full:                                        | :material-format-text-wrapping-wrap: :material-raw: |
    | [filter](#filter)                            |                                                                     | :material-moon-full: :material-valve:                       | :material-format-text-wrapping-wrap: :material-raw: |
    | [flatMap](#flatMap)                          | Collect the data of the input `Iterable` into an `Array`            | :material-moon-full: :material-valve:                       | :material-format-text-wrapping-wrap: :material-raw: |
    | [from](#from) :material-ray-start:           | Triggers the **operations chain** and store it in a new `Iterable`. | :material-moon-full: :material-valve:                       | :material-format-text-wrapping-wrap: :material-raw: |
    | [fromRange](#fromRange) :material-ray-start: | Triggers the **operations chain** and store it in a new `Iterable`. | :material-moon-full: :material-valve:                       | :material-format-text-wrapping-wrap: :material-raw: |
    | [map](#map)                                  | Collect the data of the input `Iterable` into an `Array`            | :material-moon-full: :material-valve:                       | :material-format-text-wrapping-wrap: :material-raw: |
    | [memoize](#memoize)                          | Triggers the **operations chain** and store it in a new `Iterable`. | :material-moon-full: :material-valve: :material-valve-open: | :material-format-text-wrapping-wrap: :material-raw: |
    | [repeat](#repeat) :material-ray-start:       | Triggers the **operations chain** and store it in a new `Iterable`. | :material-moon-full: :material-valve:                       | :material-format-text-wrapping-wrap: :material-raw: |
    | [tap](#tap)                                  | Triggers the **operations chain** and store it in a new `Iterable`. | :material-moon-full: :material-valve:                       | :material-format-text-wrapping-wrap: :material-raw: |
    | [tapChain](#tapChain)                        | Triggers the **operations chain** and store it in a new `Iterable`. | :material-moon-full: :material-valve-open:                  | :material-format-text-wrapping-wrap: :material-raw: |
    | [tapChainCreation](#tapChainCreation)        | Triggers the **operations chain** and store it in a new `Iterable`. | :material-circle-half-full:                                 | :material-format-text-wrapping-wrap:                |

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

## repeat

## tap

## tapChain

## tapChainCreation
