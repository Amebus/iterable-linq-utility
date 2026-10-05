---
"iterable-linq-utility": minor
---

New `groupJoin(inner, outerKey, innerKey, result)` Transformation: lazily yields `result(outer, inners)` for each value of the chain, with the values of `inner` that have the same key, compared with `SameValueZero`, like LINQ `GroupJoin`; `inner` is read whole before the first value (#40).
