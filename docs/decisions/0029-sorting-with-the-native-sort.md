# Sorting with the native sort

* Status: accepted
* Deciders: Amebus
* Date: 2026-11-02

Technical Story: https://github.com/Amebus/iterable-linq-utility/issues/41

## Context and Problem Statement

`sort` (#41) yields the values of a chain in order, stable, with the `Comparer` of `min` and `max`: a compare function, a property or a list of properties. A sort can be written in many ways: the native `Array.prototype.sort`, the sorter of LINQ, a heap or an incremental quicksort that sorts only as far as the values are read. They differ most between two uses: sorting everything (`collectToArray`) and reading only the first values (`take(10)`, `find`).

Which algorithm does `sort` use, how does it sort in descending order, and where do `null`, `undefined` and `NaN` go?

## Decision Drivers

* The full sort, the most common use, as fast as possible, on random and on already sorted data
* Stability, and the source unchanged
* The `Comparer` of `min` and `max`, without a second way to compare
* A defined place for the values that cannot be ordered
* Little code to maintain

## Considered Options

Algorithm:

* A: copy, then the native `Array.prototype.sort`
* B: the native sort on the indices, with the keys read once into arrays
* C: a JavaScript port of the `EnumerableSorter` of .NET: keys read once, quicksort of an index map, ties broken by the index
* D: a stable binary heap, or an incremental quicksort, popped on each read
* E: a hybrid: a heap for the first 32 values, then the native sort of the rest

Descending order: `{ descending: true }`; a `sortDescending` operation; a direction for each key in the `Comparer`; a compare function only.

Missing values: last in both directions; first, as the `null` of LINQ; no rule.

## Decision Outcome

Chosen option: "A: copy, then the native `Array.prototype.sort`", with comparers written for each kind of `Comparer`.

* The first read of a run copies the source into an array and sorts the copy with the native sort, which is stable since ECMAScript 2019: no index tie-break is needed.
* No comparer: the missing values are moved out in one pass, the others compared with `<`, or by subtraction when they are all numbers.
* A property: one pass moves out the values whose property is missing, and tells whether the properties are all numbers; the others are compared on the property, in the comparison.
* A list of properties without missing values: compared property by property on the values, with the reads written out for two properties. With a missing value, the properties are read once into one array per property and the indices are sorted, so that a missing property goes after a present one at its level.
* A compare function: the native sort with the function.
* Three signatures, which the types and the validation both enforce: `sort(options?)`, `sort(compare)` and `sort(keys, options?)`. `{ descending: true }` inverts the comparison, not the result, so the equal values keep the order of the source. A compare function takes no options: it decides the direction, also a different one for each property.
* `null`, `undefined` and `NaN` go last, in the order of the source, in both directions. A `null` element compared by a property is missing, not a `TypeError`, as in `min` and `max`.

Measured with Node 24 on 100,000 values (the spike of #41, and `pnpm bench:report functions/sort`):

| | full sort | first 10 values |
| --- | --- | --- |
| C, port of LINQ, against A | 26–88% slower | 26–88% slower |
| D, heap or incremental quicksort, against A | 36–94% slower, the worst on sorted data, where the native sort is linear | 4–10 times faster |
| E, hybrid, against A | 4–30% slower | 4–6 times faster |
| `sort` against `toSorted` with a hand-written comparer, random data | numbers −12%, a property −26%, two properties −23%, a function −19% | the same as the full sort |
| the same, numbers already sorted | 100,000 values −59%, 1,000 values −43% | the same as the full sort |

B was faster than A in the spike only because A compared through the generic loop of `toCompareFunction`: against comparers written for each kind, reading a property in the comparison is faster than an array of keys and an array of indices (one property 16.8 ms against 21.4 ms, two properties 30.4 ms against 56.7 ms). B stays only for a list of properties with missing values. The remaining distance from `toSorted` is mostly the cost of reading and yielding the values through iterators, about 2.3 ms for 100,000 values: on random data it is a small part of the sort (18 ms with a compare function), on sorted data, where both sorts are linear, it is most of it (5.3 ms against 2.2 ms).

### Positive Consequences

* On random data the full sort is within 12–26% of `toSorted` with a hand-written comparer, and on sorted data it stays linear; there the fixed cost of the iterators makes it about twice as slow as `toSorted`
* The `Comparer` of `min` and `max` sorts too, with one option for the direction
* The order of the values that cannot be ordered is defined and documented

### Negative Consequences

* Reading only the first values costs a full sort: `sort().take(10)` is not faster than `sort()`. A separate issue looks at it
* A property that is a getter is read in each comparison, O(n log n) times, as in `min` and `max`
* Four comparers to maintain, chosen by the kind of `Comparer` and by the values

## Pros and Cons of the Options

### A: the native sort

* Good, because it is the fastest full sort, stable by specification, and linear on sorted data (TimSort in V8)
* Bad, because the first value costs a full sort

### B: the native sort on the indices, keys read once

* Good, because a key is read once per value, which matters for a key computed by a function
* Bad, because the `Comparer` has no such key, only properties, and the arrays of keys and indices cost more than a read in the comparison

### C: the sorter of LINQ

* Good, because it is the design of `OrderBy`, with `ThenBy` through the list of keys
* Bad, because a quicksort in JavaScript is slower than the native sort everywhere

### D: a heap or an incremental quicksort

* Good, because the first values come after O(n) work
* Bad, because the full sort is much slower, and the stability costs an index tie-break

### E: the hybrid

* Good, because the first values are fast and the full sort stays close to A
* Bad, because the full sort, the common case, always pays 4–30%

### Descending order

* `{ descending }`: one option, like the `reverse` option of `fromRange`, with no comparer or with properties; the chosen one. A compare function already decides the direction, so the option would be a second way to say it
* `sortDescending`: one more operation with the same signatures
* A direction for each key: changes `Comparer`, and so `min` and `max`, for what a compare function does in one line
* A compare function only: a property or a list of properties could not be sorted in descending order

### Missing values

* Last in both directions: like `undefined` in `Array.prototype.sort`, and like `min` and `max`, where they never win; the chosen one
* First, as `null` in LINQ: then they move to the end in descending order
* No rule: `<` treats `null` as `0`, and `undefined` and `NaN` make the comparison inconsistent, so the order would be undefined
