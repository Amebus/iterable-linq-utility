---
"iterable-linq-utility": minor
---

New `except(other, keySelector?)` Transformation: lazily yields the distinct values of the chain that are not in `other`, compared with `SameValueZero` or by the key of `keySelector`, like LINQ `Except` / `ExceptBy` and `Set.prototype.difference` for any `Iterable`; `other` is read whole before the first value (#35).
