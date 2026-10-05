---
"iterable-linq-utility": minor
---

New `union(other, keySelector?)` Transformation: lazily yields the distinct values of the chain, then the values of `other` not yielded yet, compared with `SameValueZero` or by the key of `keySelector`, like LINQ `Union` / `UnionBy` and `Set.prototype.union` for any `Iterable` (#33).
