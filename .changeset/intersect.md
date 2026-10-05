---
"iterable-linq-utility": minor
---

New `intersect(other, keySelector?)` Transformation: lazily yields the distinct values of the chain that are also in `other`, compared with `SameValueZero` or by the key of `keySelector`, like LINQ `Intersect` / `IntersectBy` and `Set.prototype.intersection` for any `Iterable`; `other` is read whole before the first value (#34).
