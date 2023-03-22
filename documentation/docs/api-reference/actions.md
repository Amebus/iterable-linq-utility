# Actions

An **Action** is an operation that cause to **O~s~C** to be materialized. In other words, an **Action** is what causes triggers data manipulation to achieve the result described through the **O~s~C**.

???+ summary "TLDR list of Actions"
    | Action                            | Brief Description                                                                    |
    | --------------------------------- | ------------------------------------------------------------------------------------ |
    | [collectToArray](#collecttoarray) | Collect the data of the input `Iterable` into an `Array`                             |
    | [forEach](#foreach)               | Performs the specified action on each element of the input `Iterable`                |
    | [forEachAsync](#foreachasync)     | Performs the specified async action on each element of the input`Iterable`           |
    | [max](#max)                       | Returns the maximum value found in the input `Iterable`                              |
    | [min](#min)                       | Returns the minimum value found in the input `Iterable`                              |
    | [reduce](#reduce)                 | Accumulates all the elements of input `Iterable` into a single result and returns it |

## collectToArray

Collect the data of the input `Iterable` into an `Array`.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility'

    IterableLinq
        .from([1,2,3,4])
        .collectToArray();
    // [1,2,3,4]
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';
    
    Functions.collectToArray([1,2,3,4]);
    // [1,2,3,4]
    ```

## forEach

Performs the specified action on each element of the `Iterable<T>`.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility'

    IterableLinq
        .from([1,2,3,4])
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
    import { Functions } from 'iterable-linq-utility';
    
    Functions.forEach([1,2,3,4], v => {
        console.log(v)
        return unit();
    });
    // 1
    // 2
    // 3
    // 4
    ```

## forEachAsync

Performs the specified async action on each element of the `Iterable<T>`.  
The `forEachAsync` will wait until all the promeses are either resolved or rejected, but it will not wait the action running on the current item to complete before running the action on the next item.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility'

    IterableLinq
        .from([1,2,3,4])
        .forEach(async v => {
           return new Promise<IterableLinq.Unit>(resolve => {
           console.log(v);
           resolve(IterableLinq.unit());
        });
    });
    // 1
    // 2
    // 3
    // 4
    ```
=== "Raw Function"

    ```typescript
    import { Functions, Unit, unit } from 'iterable-linq-utility';
    
    Functions.forEach([1,2,3,4], async v => {
        return new Promise<Unit>(resolve => {
            console.log(v);
            resolve(unit());
        });
    });
    // 1
    // 2
    // 3
    // 4
    ```

## max

Returns the maximum value found in the input `Iterable`

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility'

    IterableLinq
        .from([1,2,3,4])
        .max();
    // 4
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';
    
    Functions.max([1,2,3,4]);
    // 4
    ```

It is possible to specify a custom comparer option:

1. The name or a list of names of the property to use to identify the maximum value of the `Iterable`

    === "Wrapper"

        ```typescript
        import * as IterableLinq from 'iterable-linq-utility'

        IterableLinq
            .from([{ value: 1 },{ value: 2 },{ value: 3 },{ value: 4 }])
            .max('value');
        // 4
        ```
    === "Raw Function"

        ```typescript
        import { Functions } from 'iterable-linq-utility';
        
        Functions.max([{ value: 1 },{ value: 2 },{ value: 3 },{ value: 4 }], 'value');
        // 3
        ```

2. A function like `(a: T, b: T) => number` which accepts two elements of the `Iterable` and returns a number as follow:
    * -1 if `a` is lesser than `b`
    * 0 if `a` is equal to `b`
    * 1 if `a` is greather then `b`

    === "Wrapper"

        ```typescript
        import * as IterableLinq from 'iterable-linq-utility'

        IterableLinq
            .from([1,2,3,4])
            .max( (a, b) => a === 3 ? 1 : -1 );
        // 3
        ```
    === "Raw Function"

        ```typescript
        import { Functions } from 'iterable-linq-utility';
        
        Functions.max([1,2,3,4], (a, b) => a === 3 ? 1 : -1);
        // 3
        ```

## min

Returns the minimum value found in the input `Iterable`

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility'

    IterableLinq
        .from([1,2,3,4])
        .min();
    // 1
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';
    
    Functions.min([1,2,3,4]);
    // 1
    ```

It is possible to specify a custom comparer option:

1. The name or a list of names of the property to use to identify the maximum value of the `Iterable`

    === "Wrapper"

        ```typescript
        import * as IterableLinq from 'iterable-linq-utility'

        IterableLinq
            .from([{ value: 1 },{ value: 2 },{ value: 3 },{ value: 4 }])
            .min( 'value' );
        // 1
        ```
    === "Raw Function"

        ```typescript
        import { Functions } from 'iterable-linq-utility';
        
        Functions.min([{ value: 1 },{ value: 2 },{ value: 3 },{ value: 4 }], 'value');
        // 1
        ```

2. A function like `(a: T, b: T) => number` which accepts two elements of the `Iterable` and returns a number as follow:
    * -1 if `a` is lesser than `b`
    * 0 if `a` is equal to `b`
    * 1 if `a` is greather then `b`

    === "Wrapper"

        ```typescript
        import * as IterableLinq from 'iterable-linq-utility'

        IterableLinq
            .from([1,2,3,4])
            .min( (a, b) => a === 1 ? 1 : -1 );
        // 2
        ```
    === "Raw Function"

        ```typescript
        import { Functions } from 'iterable-linq-utility';
        
        Functions.min([1,2,3,4], (a, b) => a === 1 ? 1 : -1);
        // 2
        ```

## reduce
