| | |
| --- | --- |
| **Package** | [![npm version](https://img.shields.io/npm/v/iterable-linq-utility.svg)](https://npmjs.org/package/iterable-linq-utility) [![npm downloads](https://img.shields.io/npm/dm/iterable-linq-utility.svg)](https://npmjs.org/package/iterable-linq-utility) [![jsDelivr hits](https://data.jsdelivr.com/v1/package/npm/iterable-linq-utility/badge)](https://www.jsdelivr.com/package/npm/iterable-linq-utility) |
| **Quality** | [![CI status](https://github.com/Amebus/iterable-linq-utility/actions/workflows/build-test.yml/badge.svg?branch=main&event=push)](https://github.com/Amebus/iterable-linq-utility/actions/workflows/build-test.yml?query=branch%3Amain+event%3Apush) [![Coverage](https://codecov.io/gh/Amebus/iterable-linq-utility/branch/main/graph/badge.svg)](https://codecov.io/gh/Amebus/iterable-linq-utility) |
| **Activity** | [![Commits since the latest release](https://img.shields.io/github/commits-since/Amebus/iterable-linq-utility/latest)](https://amebus.github.io/iterable-linq-utility/next/) [![Latest release date](https://img.shields.io/github/release-date/Amebus/iterable-linq-utility)](https://github.com/Amebus/iterable-linq-utility/releases/latest) [![Open issues](https://img.shields.io/github/issues/Amebus/iterable-linq-utility)](https://github.com/Amebus/iterable-linq-utility/issues) [![Open pull requests](https://img.shields.io/github/issues-pr/Amebus/iterable-linq-utility)](https://github.com/Amebus/iterable-linq-utility/pulls) |
| **Community** | [![GitHub stars](https://img.shields.io/github/stars/Amebus/iterable-linq-utility)](https://github.com/Amebus/iterable-linq-utility/stargazers) [![Forks](https://img.shields.io/github/forks/Amebus/iterable-linq-utility)](https://github.com/Amebus/iterable-linq-utility/forks) |

Lazy, re-runnable operations on JavaScript iterables, inspired by [.NET LINQ to Objects](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/linq/linq-to-objects) with JavaScript names (`Select` is `map`, `Aggregate` is `reduce`), and some new features, like [memoize](https://amebus.github.io/iterable-linq-utility/latest/api-reference/transformations/#memoize) and [materialize](https://amebus.github.io/iterable-linq-utility/latest/api-reference/actions/#materialize).

## Installation

```sh
npm install iterable-linq-utility
```

## Usage

```ts
import * as IterableLinq from 'iterable-linq-utility';

const chain = IterableLinq
	.from([1, 2, 3, 4, 5, 6])
	.filter(v => v % 2 === 0)
	.map(v => v * 10);   // nothing runs yet

chain.collectToArray();  // [20, 40, 60]
chain.max();             // 60: the same chain runs again
```

## Documentation

The [documentation site](https://amebus.github.io/iterable-linq-utility/latest/) has the details:

- [Getting Started](https://amebus.github.io/iterable-linq-utility/latest/getting-started/): installation from npm or a CDN, and the module formats;
- [Basic Concepts](https://amebus.github.io/iterable-linq-utility/latest/basic-concepts/): actions, transformations and taps, deferred execution, equality, selectors;
- [API Reference](https://amebus.github.io/iterable-linq-utility/latest/api-reference/): every operation, on the chain and as a raw function in `Functions`;
- [Changelog](https://amebus.github.io/iterable-linq-utility/latest/changelog/) and the migration guides;
- [How to contribute](https://amebus.github.io/iterable-linq-utility/latest/how-to-contribute/).

## Benchmarks

The benchmarks compare every operation with a native reference. How to run them, read them and add one: [Benchmarks](https://amebus.github.io/iterable-linq-utility/next/benchmarks/), in the contributor guide.
