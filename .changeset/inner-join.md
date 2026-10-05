---
"iterable-linq-utility": minor
---

New `innerJoin(inner, outerKey, innerKey, result)` Transformation: lazily yields `result(outer, inner)` for each pair of a value of the chain and a value of `inner` with the same key, compared with `SameValueZero`, like LINQ `Join`; `inner` is read whole before the first value (#39).
