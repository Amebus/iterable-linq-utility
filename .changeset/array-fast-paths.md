---
"iterable-linq-utility": minor
---

`includes`, `indexOf`, `lastIndexOf`, `at`, `findLast` and `findLastIndex` read an array with the built-in iterator by index, and `includes` calls `Set.prototype.has` on a `Set`, with the same result: on 100,000 numbers they are from 2× to thousands of times faster, and `findLast(predicate)` and `findLastIndex(predicate)` on an array call `predicate` from the last value backward up to the first match, like `Array.prototype.findLast`, as described in [ADR 0036](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0036-actions-read-an-array-by-index.md) (#138).
