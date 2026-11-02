---
"iterable-linq-utility": minor
---

The validation messages name the argument (`"iterable"`, `"other"`, `"inner"` or `"others"` instead of `"sourceIterable"`), and `min`, `max`, `memoize`, `fromRange`, `Functions.range` and `join` validate their arguments; `memoize({ allowPartialMemoization: undefined })` now uses the partial memoization, the default, instead of the full one ([migration guide](https://amebus.github.io/iterable-linq-utility/0.13/migrating-to-0.13.0/)) (#202).
