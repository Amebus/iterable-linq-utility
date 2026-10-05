---
"iterable-linq-utility": minor
---

New `zip(...others)` Transformation: yields tuples of the values at the same position in the source and in each of `others`, typed as `[T, ...U]`. It stops at the end of the shortest iterable and closes the others (#36).
