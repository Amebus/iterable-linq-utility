---
"iterable-linq-utility": patch
---

`count()`, `at(index)`, `includes(value)`, `indexOf(value)`, `lastIndexOf(value)`, `findLast(predicate)` and `findLastIndex(predicate)` read by index, without iterating them, the values stored by `materialize()`, now kept in an array with a quarter of the memory, and the cache of a `memoize()` that is full or has been read to the end, with the same results, as described in [ADR 0038](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0038-memoize-and-materialize-give-their-values-as-an-array.md) (#225).
