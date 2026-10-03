---
"iterable-linq-utility": minor
---

New `skipWhile(predicate)` Transformation: lazily skips values while `predicate` returns `true` and yields the rest, without calling `predicate` again after the first rejected value (#29).
