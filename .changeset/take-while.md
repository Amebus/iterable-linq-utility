---
"iterable-linq-utility": minor
---

New `takeWhile(predicate)` Transformation: lazily yields values while `predicate` returns `true`, then closes the source without reading further; a type guard narrows the element type (#28).
