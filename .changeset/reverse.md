---
"iterable-linq-utility": minor
---

New `reverse()` Transformation: yields the values in reverse order without changing the source, like `Array.prototype.toReversed`. It reads the whole source before the first value, and every run reads the source again (#42).
