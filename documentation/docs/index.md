# Overview

!!! danger "The library and the documentation are in WIP status"

[![](https://data.jsdelivr.com/v1/package/npm/iterable-linq-utility/badge)](https://www.jsdelivr.com/package/npm/iterable-linq-utility)

A [.NET Linq to Objects](https://learn.microsoft.com/it-it/dotnet/csharp/programming-guide/concepts/linq/linq-to-objects) porting with javacript naming conventions (e.g.: `Select` as been ranamed to `map`) and some new features (e.g.: [memoize](api-reference/transformations.md#memoize) and [materialize](api-reference/actions.md#materialize)).

## Main Idea

As the previous description says, the idea is to create a kind-of-porting of [.NET Linq to Objects](https://learn.microsoft.com/it-it/dotnet/csharp/programming-guide/concepts/linq/linq-to-objects) with a naming convetions that is more javascript and functional programming oriented and not sql oriented [^1].  
In other words the idea is:

- to keep the [LINQ Deferred Exceution](https://learn.microsoft.com/en-us/dotnet/standard/linq/deferred-execution-lazy-evaluation#deferred-execution) and apply it to the [JavaScript Iterator Protocol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) with a more standard way of naming well known high order functions like `map`, `flatMap`, `reduce` used by javascript and some functional programming libraries (e.g.: [Ramdajs](https://github.com/functionalland/ramda), [SanctuaryJs](https://github.com/orgs/sanctuary-js/repositories?type=all), [FantasyLand](https://github.com/fantasyland) and [lodash](https://github.com/lodash/lodash)). 
- to keep the **Linq repeatable execution** which allows to traverse the same chain multiple times without having to recreate it from scratch every time, in this way is possible to store the chain in a variable like `const myChain = IterableLinq.from([,1,2,3,4]).filter().map()` and then trigger it to get the max and min without recreating it:
  ```ts
  const max = myChain.max();
  const min = myChain.min(); // using the same chain twice
  ```

Since in javascript you cannot rely on [extensions methods](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/extension-methods) as in c# there is the need to create a wrapper over `Iterable` to achive the same [Deferred Exceution](https://learn.microsoft.com/en-us/dotnet/standard/linq/deferred-execution-lazy-evaluation#deferred-execution) concept.  
To help document the package we also take a cue from some definitions used by [Apache Spark](https://spark.apache.org/), since, in fact, the wrapper created is similar to [Apache Spark's RDDs](https://spark.apache.org/docs/latest/rdd-programming-guide.html#resilient-distributed-datasets-rdds).  
Hence we are going to name a code like the following:

```ts title="Operations Chain example"
IterableLinq
  .fromRange(start, end)
  .filter(myFilterFunction)
  .map(myMapFunction)
  .collectToArray()
```

as **Operations Chain** or **O~s~C**.  
The **O~s~C** supports two types of operations:

- [Actions](/api-reference/actions.md)
- [Transformations](/api-reference/transformations.md)

like [Spark RDD Operations](https://spark.apache.org/docs/latest/rdd-programming-guide.html#rdd-operations)

!!! note
    There is no multi node implementation running into `iterable-linq-utility` package, evertything is done on the same machine and is single thread. From [Apache Spark](https://spark.apache.org/) comes only some definitons and ideas to help to document the package itself.

So let's [get started](getting-started.md)

[^1]: [What is the reasoning behind naming of the .NETs Select (Map) and Aggregate (Reduce)?](https://softwareengineering.stackexchange.com/questions/311007/what-is-the-reasoning-behind-naming-of-the-nets-select-map-and-aggregate-red)