---
"iterable-linq-utility": minor
---

New `chunk(size)` Transformation: yields arrays of `size` values, the last one with the remaining values. Each array is yielded once its values have been read, so it works with infinite sources (#37).
