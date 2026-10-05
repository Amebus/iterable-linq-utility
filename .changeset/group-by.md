---
"iterable-linq-utility": minor
---

New `groupBy(keySelector)` Transformation: yields one `[key, values]` pair for each key, in the order of the first appearance of the key, with the keys compared with `SameValueZero`, like LINQ `GroupBy` and `Map.groupBy` for any `Iterable`; the whole chain is read before the first group (#38).
