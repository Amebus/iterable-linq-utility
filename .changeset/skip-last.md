---
"iterable-linq-utility": minor
---

New `skipLast(count)` Transformation: yields every value except the last `count`, each one once `count` more values have been read, so it works with infinite sources. It keeps a buffer of `count` values (#31).
