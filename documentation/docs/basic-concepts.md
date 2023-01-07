# Basic Concepts

## Actions vs Transformations

!!! quote
    Transformations create RDDs from each other, but when we want to work with the actual dataset, at that point action is performed. When the action is triggered after the result, new RDD is not formed like transformation.  
    Thus, Actions are Spark RDD operations that give non-RDD values.  
    The values of action are stored to drivers or to the external storage system. It brings laziness of RDD into motion. [^1]

With the same idea of [Apache Spark](https://spark.apache.org/) in mind, there are two main kind of operations provided by the `Linq Iterable Utility` package:

- [Actions](api-reference/actions.md)
- [Transformations](api-reference/transformations.md)

### Actions

[Actions](api-reference/actions.md) can be seen as **ending operations** because they will cause the **operations chain** to be computed and will return the result of the computation.  
The simplest **Action** that can come in mind is the `collectToArray`, which returns an array with all the items returned by the **operations chain**.
Other famous [Actions](api-reference/actions.md) are: `some`, `reduce`, `max` and `min` to name some of them.  
The full list of [Actions](api-reference/actions.md) provided by `Linq ITerable Utility` can be found [here](api-reference/actions.md).  

### Transformations

On the other hand, [Transformations](api-reference/transformations.md) are operations that compose the **operations chain** and consists of a list of data manipulation
operation.
The simplest and most known **Transformation** is certainly the `map` one, which is generally use to change the shape of every item of a list.
Other famous [Transformations](api-reference/transformations.md) are: `filter` and `flatMap` to name some of them.  
The full list of [Transformations](api-reference/transformations.md) provided by `Linq ITerable Utility` can be found [here](api-reference/transformations.md).  

## Summary

| Operations      | Returned Type                | Behaviour                                                                                                                                                                                                    |
| --------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Actions         | Primitive Type or Object (1) | Triggers the chain of operations on which is executed. The operation requested by the action is immediatly run.                                                                                              |
| Transformations | `ILinqIterable`              | Adds a data manipulation operation to the chain of operations on which it is executed. The operation requested by the trasformation will only be run if an action is requested over the **operations chain** |

!!! info
    The is one exception to the [Actions Definition](#actions). The [materialize](api-reference/actions.md#materialize) is an **Actions** even if it returns an `ILinqIterable`, the reason is that we need to keep alive the iterable wrapper provided by the `linq-iterable-utility` so that is possible to continue with the data manipulation.  
    Indepth can be found [here](advanced-concepts/index.md).

[^1]: [Spark RDD Operations-Transformation & Action with Example](https://data-flair.training/blogs/spark-rdd-operations-transformations-actions/)
