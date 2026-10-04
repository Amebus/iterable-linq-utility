---
"iterable-linq-utility": minor
---

New `takeLast(count)` Transformation: yields the last `count` values. It reads the whole source before the first value, keeping a buffer of `count` values (#30).
