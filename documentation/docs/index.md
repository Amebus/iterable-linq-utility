# Overview

!!! danger "The library and the documentation are in WIP status"

[![jsDelivr hits](https://data.jsdelivr.com/v1/package/npm/iterable-linq-utility/badge)](https://www.jsdelivr.com/package/npm/iterable-linq-utility)
[![npm version](https://img.shields.io/npm/v/iterable-linq-utility.svg)](https://npmjs.org/package/iterable-linq-utility)
[![npm downloads](https://img.shields.io/npm/dm/iterable-linq-utility.svg)](https://npmjs.org/package/iterable-linq-utility)
[![CI status](https://github.com/Amebus/iterable-linq-utility/actions/workflows/build-test.yml/badge.svg?branch=main&event=push)](https://github.com/Amebus/iterable-linq-utility/actions/workflows/build-test.yml?query=branch%3Amain+event%3Apush)
[![Commits since the latest release](https://img.shields.io/github/commits-since/Amebus/iterable-linq-utility/latest)](https://amebus.github.io/iterable-linq-utility/next/)
[![GitHub stars](https://img.shields.io/github/stars/Amebus/iterable-linq-utility)](https://github.com/Amebus/iterable-linq-utility/stargazers)
[![Latest release date](https://img.shields.io/github/release-date/Amebus/iterable-linq-utility)](https://github.com/Amebus/iterable-linq-utility/releases/latest)
[![Open issues](https://img.shields.io/github/issues/Amebus/iterable-linq-utility)](https://github.com/Amebus/iterable-linq-utility/issues)
[![Open pull requests](https://img.shields.io/github/issues-pr/Amebus/iterable-linq-utility)](https://github.com/Amebus/iterable-linq-utility/pulls)
[![Forks](https://img.shields.io/github/forks/Amebus/iterable-linq-utility)](https://github.com/Amebus/iterable-linq-utility/forks)

A [.NET Linq to Objects](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/linq/linq-to-objects) porting with JavaScript naming conventions (e.g.: `Select` has been renamed to `map`) and some new features (e.g.: [memoize](api-reference/transformations.md#memoize) and [materialize](api-reference/actions.md#materialize)).

## Main Idea

As the previous description says, the idea is to create a kind-of-porting of [.NET Linq to Objects](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/linq/linq-to-objects) with a naming convention that is more javascript and functional programming oriented and not sql oriented [^1].  
In other words the idea is:

- to keep the [LINQ Deferred Execution](https://learn.microsoft.com/en-us/dotnet/standard/linq/deferred-execution-lazy-evaluation#deferred-execution) and apply it to the [JavaScript Iterator Protocol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) with a more standard way of naming well known high order functions like `map`, `flatMap`, `reduce` used by javascript and some functional programming libraries (e.g.: [Ramdajs](https://github.com/functionalland/ramda), [SanctuaryJs](https://github.com/orgs/sanctuary-js/repositories?type=all), [FantasyLand](https://github.com/fantasyland) and [lodash](https://github.com/lodash/lodash)). 
- to keep the **Linq repeatable execution** which allows to traverse the same chain multiple times without having to recreate it from scratch every time, in this way is possible to store the chain in a variable and then trigger it to get the max and min without recreating it:
  ```ts title="Repeatable execution"
  const myChain = IterableLinq.from([1,2,3,4]).filter(v => v % 2 === 0).map(v => v * 10); // chain creation, nothing runs
  const max = myChain.max(); // 40
  const min = myChain.min(); // 20, the same chain runs again
  ```

Since in javascript you cannot rely on [extensions methods](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/extension-methods) as in c# there is the need to create a wrapper over `Iterable` to achieve the same [Deferred Execution](https://learn.microsoft.com/en-us/dotnet/standard/linq/deferred-execution-lazy-evaluation#deferred-execution) concept.  
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
The **O~s~C** supports three types of operations:

- [Actions](api-reference/actions.md)
- [Transformations](api-reference/transformations.md)
- [Taps](basic-concepts.md#taps)

Actions and transformations are modelled on [Spark RDD Operations](https://spark.apache.org/docs/latest/rdd-programming-guide.html#rdd-operations)

!!! note
    There is no multi node implementation running into `iterable-linq-utility` package, everything is done on the same machine and is single thread. From [Apache Spark](https://spark.apache.org/) comes only some definitions and ideas to help to document the package itself.

So let's [get started](getting-started.md)

[^1]: [What is the reasoning behind naming of the .NETs Select (Map) and Aggregate (Reduce)?](https://softwareengineering.stackexchange.com/questions/311007/what-is-the-reasoning-behind-naming-of-the-nets-select-map-and-aggregate-red)